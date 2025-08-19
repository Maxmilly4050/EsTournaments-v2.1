"use client"

import { useState, useEffect } from "react"
import { groupsService } from "@/lib/groups-service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Plus,
  Search,
  Crown,
  Shield,
  User,
  Settings,
  UserMinus,
  LogOut,
  Lock,
  Globe,
  Calendar,
  Hash,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function GroupsManagement({ userId }) {
  const [userGroups, setUserGroups] = useState([])
  const [publicGroups, setPublicGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [createGroupData, setCreateGroupData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    maxMembers: 50,
  })

  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchGroupsData()
    }
  }, [userId])

  const fetchGroupsData = async () => {
    setLoading(true)
    try {
      const [userGroupsResult, publicGroupsResult] = await Promise.all([
        groupsService.getUserGroups(userId),
        groupsService.getPublicGroups(userId),
      ])

      if (userGroupsResult.success) setUserGroups(userGroupsResult.data)
      if (publicGroupsResult.success) setPublicGroups(publicGroupsResult.data)
    } catch (error) {
      console.error("Error fetching groups data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    try {
      const result = await groupsService.createGroup(createGroupData, userId)
      if (result.success) {
        toast({
          title: "Group created",
          description: "Your group has been created successfully.",
        })
        setIsCreateDialogOpen(false)
        setCreateGroupData({ name: "", description: "", isPrivate: false, maxMembers: 50 })
        fetchGroupsData()
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
        description: "Failed to create group",
        variant: "destructive",
      })
    }
  }

  const handleJoinGroup = async (groupId) => {
    try {
      const result = await groupsService.joinGroup(groupId, userId)
      if (result.success) {
        toast({
          title: "Joined group",
          description: "You have successfully joined the group.",
        })
        fetchGroupsData()
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
        description: "Failed to join group",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = async (groupId) => {
    try {
      const result = await groupsService.leaveGroup(groupId, userId)
      if (result.success) {
        toast({
          title: "Left group",
          description: "You have left the group.",
        })
        fetchGroupsData()
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
        description: "Failed to leave group",
        variant: "destructive",
      })
    }
  }

  const handleSearchGroups = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const result = await groupsService.searchGroups(query, userId)
      if (result.success) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error("Error searching groups:", error)
    }
  }

  const fetchGroupMembers = async (groupId) => {
    try {
      const result = await groupsService.getGroupMembers(groupId)
      if (result.success) {
        setGroupMembers(result.data)
      }
    } catch (error) {
      console.error("Error fetching group members:", error)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-400" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadge = (role) => {
    const colors = {
      owner: "bg-yellow-600 text-white",
      admin: "bg-blue-600 text-white",
      member: "bg-gray-600 text-white",
    }
    return (
      <Badge className={colors[role] || colors.member}>
        {getRoleIcon(role)}
        <span className="ml-1 capitalize">{role}</span>
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Group Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Groups</h2>
        <div className="flex space-x-2">
          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-gray-300 bg-transparent">
                <Search className="w-4 h-4 mr-2" />
                Find Groups
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Find Groups</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchGroups(e.target.value)
                    }}
                    className="bg-slate-700 border-slate-600 text-white pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={group.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-purple-600 text-white">{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{group.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{group.current_members} members</span>
                            {group.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                      <div>
                        {!group.isMember ? (
                          <Button
                            size="sm"
                            onClick={() => handleJoinGroup(group.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Member
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No groups found</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName" className="text-white">
                    Group Name
                  </Label>
                  <Input
                    id="groupName"
                    value={createGroupData.name}
                    onChange={(e) => setCreateGroupData({ ...createGroupData, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="groupDescription" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="groupDescription"
                    value={createGroupData.description}
                    onChange={(e) => setCreateGroupData({ ...createGroupData, description: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Describe your group"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers" className="text-white">
                    Max Members
                  </Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={createGroupData.maxMembers}
                    onChange={(e) =>
                      setCreateGroupData({ ...createGroupData, maxMembers: Number.parseInt(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    min="2"
                    max="500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPrivate"
                    checked={createGroupData.isPrivate}
                    onCheckedChange={(checked) => setCreateGroupData({ ...createGroupData, isPrivate: checked })}
                  />
                  <Label htmlFor="isPrivate" className="text-white">
                    Private Group
                  </Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-slate-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700">
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my-groups" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="my-groups" className="data-[state=active]:bg-slate-700">
            My Groups ({userGroups.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="data-[state=active]:bg-slate-700">
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups">
          <div className="space-y-4">
            {userGroups.length > 0 ? (
              userGroups.map((group) => (
                <Card key={group.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={group.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-purple-600 text-white text-xl">
                            {group.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-white">{group.name}</h3>
                            {group.is_private ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Globe className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-gray-400">{group.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>
                                {group.current_members}/{group.max_members} members
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {new Date(group.joinedAt).toLocaleDateString()}</span>
                            </div>
                            {getRoleBadge(group.userRole)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group)
                            fetchGroupMembers(group.id)
                          }}
                          className="border-slate-600 text-gray-300"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                        {group.userRole !== "owner" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLeaveGroup(group.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't joined any groups yet</p>
                    <p className="text-gray-500 text-sm">
                      Create a group or discover existing ones to connect with other players
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicGroups.map((group) => (
              <Card key={group.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={group.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-600 text-white">{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-white font-medium">{group.name}</h4>
                        <p className="text-gray-400 text-sm line-clamp-2">{group.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{group.current_members} members</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {!group.isMember ? (
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Join
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Member
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Group Management Dialog */}
      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center space-x-2">
                <Hash className="w-5 h-5" />
                <span>{selectedGroup.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded">
                <div>
                  <p className="text-white font-medium">Group Information</p>
                  <p className="text-gray-400 text-sm">{selectedGroup.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <span>
                      {selectedGroup.current_members}/{selectedGroup.max_members} members
                    </span>
                    <span>{selectedGroup.is_private ? "Private" : "Public"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">Members ({groupMembers.length})</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white">{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          {member.username && <p className="text-gray-400 text-sm">@{member.username}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(member.role)}
                        {selectedGroup.userRole === "owner" && member.role !== "owner" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
