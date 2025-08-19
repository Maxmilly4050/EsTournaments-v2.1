"use client"

import { useState, useEffect } from "react"
import { friendsService } from "@/lib/friends-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, UserPlus, Search, Check, X, UserMinus, Clock, Activity, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function FriendsManagement({ userId }) {
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState({ incoming: [], outgoing: [] })
  const [friendActivity, setFriendActivity] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchFriendsData()
    }
  }, [userId])

  const fetchFriendsData = async () => {
    setLoading(true)
    try {
      const [friendsResult, requestsResult, activityResult] = await Promise.all([
        friendsService.getFriends(userId),
        friendsService.getPendingRequests(userId),
        friendsService.getFriendActivity(userId),
      ])

      if (friendsResult.success) setFriends(friendsResult.data)
      if (requestsResult.success) setPendingRequests(requestsResult.data)
      if (activityResult.success) setFriendActivity(activityResult.data)
    } catch (error) {
      console.error("Error fetching friends data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const result = await friendsService.searchUsers(query, userId)
      if (result.success) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      const result = await friendsService.sendFriendRequest(userId, targetUserId)
      if (result.success) {
        toast({
          title: "Friend request sent",
          description: "Your friend request has been sent successfully.",
        })
        // Refresh search results
        handleSearch(searchQuery)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const result = await friendsService.acceptFriendRequest(requestId)
      if (result.success) {
        toast({
          title: "Friend request accepted",
          description: "You are now friends!",
        })
        fetchFriendsData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      })
    }
  }

  const handleDeclineRequest = async (requestId) => {
    try {
      const result = await friendsService.declineFriendRequest(requestId)
      if (result.success) {
        toast({
          title: "Friend request declined",
          description: "The friend request has been declined.",
        })
        fetchFriendsData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFriend = async (friendshipId) => {
    try {
      const result = await friendsService.removeFriend(friendshipId)
      if (result.success) {
        toast({
          title: "Friend removed",
          description: "Friend has been removed from your list.",
        })
        fetchFriendsData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Friend Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Friends</h2>
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Find Friends</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  className="bg-slate-700 border-slate-600 text-white pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {searchLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{user.full_name || user.username}</p>
                        {user.username && <p className="text-gray-400 text-sm">@{user.username}</p>}
                      </div>
                    </div>
                    <div>
                      {user.friendshipStatus === "none" && (
                        <Button
                          size="sm"
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                      {user.friendshipStatus === "pending_sent" && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {user.friendshipStatus === "friends" && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          <Check className="w-3 h-3 mr-1" />
                          Friends
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {searchQuery && !searchLoading && searchResults.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No users found</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="friends" className="data-[state=active]:bg-slate-700">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-slate-700">
            Requests ({pendingRequests.incoming.length + pendingRequests.outgoing.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              {friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.friendshipId}
                      className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white">{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{friend.name}</p>
                          {friend.username && <p className="text-gray-400 text-sm">@{friend.username}</p>}
                          <p className="text-gray-500 text-xs">
                            Friends since {new Date(friend.since).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.friendshipId)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No friends yet</p>
                  <p className="text-gray-500 text-sm">Start by adding some friends to connect with other players</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-4">
            {/* Incoming Requests */}
            {pendingRequests.incoming.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Incoming Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.incoming.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-600 text-white">{request.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{request.name}</p>
                            {request.username && <p className="text-gray-400 text-sm">@{request.username}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineRequest(request.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outgoing Requests */}
            {pendingRequests.outgoing.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Sent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.outgoing.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-600 text-white">{request.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{request.name}</p>
                            {request.username && <p className="text-gray-400 text-sm">@{request.username}</p>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingRequests.incoming.length === 0 && pendingRequests.outgoing.length === 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No pending requests</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Friend Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friendActivity.length > 0 ? (
                <div className="space-y-3">
                  {friendActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {activity.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-medium">{activity.user.name}</span> joined{" "}
                          <Link
                            href={`/tournaments/${activity.tournament.id}`}
                            className="text-blue-400 hover:underline"
                          >
                            {activity.tournament.title}
                          </Link>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.tournament.game}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-gray-500 text-sm">Friend activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
