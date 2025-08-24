"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCircle, Clock, Trophy, Users, Copy, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"

export default function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Set up real-time subscription for new notifications
      const subscription = setupRealtimeSubscription()
      return () => subscription?.unsubscribe()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=20&offset=0')
      const result = await response.json()

      if (result.success) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unread_count)
      } else {
        console.error('Failed to fetch notifications:', result.error)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return null

    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload.new)
          // Add new notification to the list
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()
  }

  const markAsRead = async (notificationIds) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_ids: notificationIds })
      })

      const result = await response.json()
      // Normalize IDs to strings to ensure matching works regardless of type
      const idsStr = (notificationIds || []).map((id) => String(id))

      if (result.success) {
        // Update local state (optimistic)
        setNotifications((prev) =>
          prev.map((notif) =>
            idsStr.includes(String(notif.id))
              ? { ...notif, is_read: true }
              : notif
          )
        )
        // Use server unread_count if present; otherwise decrement locally
        setUnreadCount((prev) =>
          typeof result?.data?.unread_count === 'number'
            ? result.data.unread_count
            : Math.max(0, prev - idsStr.length)
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mark_all_read: true })
      })

      const result = await response.json()
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        )
        setUnreadCount(result.data?.unread_count ?? 0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_ids: [notificationId] })
      })

      const result = await response.json()
      if (result.success) {
        // Remove deleted notification from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        // Update unread count if provided by the server
        if (typeof result.data?.unread_count === 'number') {
          setUnreadCount(result.data.unread_count)
        }
      } else {
        console.error('Failed to delete notification:', result.error)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const toggleNotificationRead = async (notification) => {
    if (notification.is_read) {
      // Can't unmark as read - notifications are typically one-way
      return
    }
    // Mark as read
    markAsRead([notification.id])
  }

  const extractRoomCode = (message) => {
    // Match patterns like "room code: 766666" or "code: 766666" or "room code 766666"
    // More specific pattern to avoid false positives
    const codeMatch = message.match(/(?:match\s+room\s+code|room\s+code|code)[:]\s*([A-Z0-9]{3,})/i)
    return codeMatch ? codeMatch[1] : null
  }

  const copyRoomCode = async (roomCode, notificationId) => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopiedCode(notificationId)
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy room code:', error)
    }
  }

  const handleNotificationClick = async (notification, event) => {
    // Check if the click target is a button to avoid conflicts
    if (event.target.closest('button')) return

    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead([notification.id])
    }

    // Check for room code and copy it
    const roomCode = extractRoomCode(notification.message)
    if (roomCode) {
      event.preventDefault()
      await copyRoomCode(roomCode, notification.id)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'result_notification':
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'match_reminder':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'tournament_update':
        return <Users className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (!user) return null

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative p-2"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <span className="text-sm text-gray-500">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications</h3>
                <p className="text-gray-500 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={(event) => handleNotificationClick(notification, event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            {/* Individual Action Buttons */}
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-green-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleNotificationRead(notification)
                                  }}
                                  title="Mark as read"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm('Are you sure you want to delete this notification?')) {
                                    deleteNotification(notification.id)
                                  }
                                }}
                                title="Delete notification"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          {(() => {
                            const roomCode = extractRoomCode(notification.message)
                            return roomCode && (
                              <div className="flex items-center gap-2 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyRoomCode(roomCode, notification.id)
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  {copiedCode === notification.id ? 'Copied!' : `Copy ${roomCode}`}
                                </Button>
                              </div>
                            )
                          })()}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.tournaments?.name && (
                              <span className="text-xs text-gray-500 truncate max-w-24">
                                {notification.tournaments.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="text-center pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
