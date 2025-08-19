"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, X, Check, Clock, Trophy, AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const fetchingRef = useRef(false)
  const lastUserIdRef = useRef(null)
  const cacheRef = useRef({ data: null, timestamp: 0 })
  const CACHE_DURATION = 30000 // 30 seconds

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    if (fetchingRef.current) {
      console.log("[v0] Notification fetch already in progress, skipping")
      return
    }

    const now = Date.now()
    if (cacheRef.current.data && now - cacheRef.current.timestamp < CACHE_DURATION) {
      console.log("[v0] Using cached notifications")
      setNotifications(cacheRef.current.data.notifications)
      setUnreadCount(cacheRef.current.data.notifications.filter((n) => !n.is_read).length)
      return
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      console.log("[v0] Fetching notifications for user:", user.id)

      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n) => !n.is_read).length)

        cacheRef.current = {
          data: data,
          timestamp: now,
        }
        console.log("[v0] Successfully fetched", data.notifications.length, "notifications")
      } else {
        console.error("[v0] Failed to fetch notifications:", response.status)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && user.id !== lastUserIdRef.current) {
      console.log("[v0] User ID changed, fetching notifications")
      lastUserIdRef.current = user.id
      fetchNotifications()
    }
  }, [user?.id, fetchNotifications])

  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (notificationIds.includes(n.id) ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))

        if (cacheRef.current.data) {
          cacheRef.current.data.notifications = cacheRef.current.data.notifications.map((n) =>
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n,
          )
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }, [notifications, markAsRead])

  const getNotificationIcon = (type) => {
    switch (type) {
      case "match_reminder":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "deadline_warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "result_notification":
        return <Trophy className="w-4 h-4 text-green-400" />
      case "admin_decision":
        return <Settings className="w-4 h-4 text-purple-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-300 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`m-2 cursor-pointer transition-all ${
                      notification.is_read
                        ? "bg-slate-700/30 border-slate-600"
                        : "bg-slate-700/60 border-slate-500 shadow-md"
                    }`}
                    onClick={() => !notification.is_read && markAsRead([notification.id])}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4
                              className={`text-sm font-medium ${notification.is_read ? "text-gray-300" : "text-white"}`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${notification.is_read ? "text-gray-400" : "text-gray-300"}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            {notification.tournaments && (
                              <span className="text-xs text-blue-400">{notification.tournaments.title}</span>
                            )}
                            <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
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
            <div className="p-3 border-t border-slate-700 text-center">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
