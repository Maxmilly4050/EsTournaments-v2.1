"use client"

import { useState, useEffect } from "react"
import { adminService } from "@/lib/admin-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Edit,
  History,
  Shield,
  Ban,
  CheckCircle,
  Unlock,
  DollarSign,
  Calendar,
  Search,
  AlertTriangle,
} from "lucide-react"

export function ProfileManagementTab({ currentUser }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [editHistory, setEditHistory] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    display_name: "",
    gamer_tag: "",
    bio: "",
    country: "",
    konami_username: "",
    ea_id: "",
    is_verified: false,
    is_banned: false,
    can_host_tournaments: false,
    ban_reason: "",
    ban_expires_at: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchProfiles()
  }, [searchTerm])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const result = await adminService.getUserProfiles(searchTerm)
      if (result.success) {
        setProfiles(result.data)
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
        description: "Failed to fetch profiles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile)
    setEditForm({
      display_name: profile.display_name || "",
      gamer_tag: profile.gamer_tag || "",
      bio: profile.bio || "",
      country: profile.country || "",
      konami_username: profile.konami_username || "",
      ea_id: profile.ea_id || "",
      is_verified: profile.is_verified || false,
      is_banned: profile.is_banned || false,
      can_host_tournaments: profile.can_host_tournaments || false,
      ban_reason: profile.ban_reason || "",
      ban_expires_at: profile.ban_expires_at || "",
    })
    setEditDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!selectedProfile) return

    try {
      const result = await adminService.updateUserProfile(
        selectedProfile.id,
        editForm,
        currentUser.id,
        "Admin profile update",
      )

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "User profile has been updated successfully",
        })
        setEditDialogOpen(false)
        fetchProfiles()
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
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handleViewHistory = async (profile) => {
    setSelectedProfile(profile)
    try {
      const [historyResult, paymentResult] = await Promise.all([
        adminService.getProfileEditHistory(profile.id),
        adminService.getPaymentHistory(profile.id),
      ])

      if (historyResult.success) {
        setEditHistory(historyResult.data)
      }
      if (paymentResult.success) {
        setPaymentHistory(paymentResult.data)
      }

      setHistoryDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user history",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async (userId, reason, expiresAt) => {
    try {
      const result = await adminService.banUser(userId, reason, expiresAt, currentUser.id)
      if (result.success) {
        toast({
          title: "User banned",
          description: "User has been banned successfully",
        })
        setBanDialogOpen(false)
        fetchProfiles()
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
        description: "Failed to ban user",
        variant: "destructive",
      })
    }
  }

  const handleUnbanUser = async (userId) => {
    try {
      const result = await adminService.unbanUser(userId, currentUser.id)
      if (result.success) {
        toast({
          title: "User unbanned",
          description: "User has been unbanned successfully",
        })
        fetchProfiles()
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
        description: "Failed to unban user",
        variant: "destructive",
      })
    }
  }

  const handleVerifyUser = async (userId) => {
    try {
      const result = await adminService.verifyUser(userId, currentUser.id)
      if (result.success) {
        toast({
          title: "User verified",
          description: "User has been verified successfully",
        })
        fetchProfiles()
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
        description: "Failed to verify user",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : "Never"
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Profile Management</h2>
        <div className="relative">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-slate-700 border-slate-600 text-white pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">
                      {profile.display_name || profile.full_name || profile.username || "Unknown"}
                    </CardTitle>
                    {profile.gamer_tag && <p className="text-gray-400 text-sm">@{profile.gamer_tag}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-1">
                  {profile.is_verified && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile.is_banned && (
                    <Badge className="bg-red-600 text-white">
                      <Ban className="w-3 h-3 mr-1" />
                      Banned
                    </Badge>
                  )}
                  {profile.can_host_tournaments && (
                    <Badge className="bg-blue-600 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Host
                    </Badge>
                  )}
                  {profile.email_verified && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Email ✓
                    </Badge>
                  )}
                  {profile.phone_verified && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Phone ✓
                    </Badge>
                  )}
                </div>

                {/* Profile Info */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{profile.country || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joined:</span>
                    <span className="text-white">{formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ranking:</span>
                    <span className="text-white">#{profile.global_ranking || 0}</span>
                  </div>
                </div>

                {/* Game IDs */}
                {(profile.konami_username || profile.ea_id) && (
                  <div className="space-y-1 text-sm">
                    {profile.konami_username && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Konami:</span>
                        <span className="text-white">{profile.konami_username}</span>
                      </div>
                    )}
                    {profile.ea_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">EA ID:</span>
                        <span className="text-white">{profile.ea_id}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Ban Info */}
                {profile.is_banned && (
                  <div className="p-2 bg-red-900/20 border border-red-700 rounded">
                    <p className="text-red-300 text-sm">
                      <strong>Banned:</strong> {profile.ban_reason}
                    </p>
                    {profile.ban_expires_at && (
                      <p className="text-red-400 text-xs">Expires: {formatDate(profile.ban_expires_at)}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditProfile(profile)}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewHistory(profile)}
                    className="border-slate-600 text-gray-300"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  {profile.is_banned ? (
                    <Button
                      size="sm"
                      onClick={() => handleUnbanUser(profile.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProfile(profile)
                        setBanDialogOpen(true)
                      }}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Edit Profile - {selectedProfile?.display_name || selectedProfile?.full_name || "Unknown"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Display Name</Label>
                  <Input
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Gamer Tag</Label>
                  <Input
                    value={editForm.gamer_tag}
                    onChange={(e) => setEditForm({ ...editForm, gamer_tag: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Bio</Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-white">Country</Label>
                <Input
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Game IDs */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Game IDs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Konami Username</Label>
                  <Input
                    value={editForm.konami_username}
                    onChange={(e) => setEditForm({ ...editForm, konami_username: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">EA Sports ID</Label>
                  <Input
                    value={editForm.ea_id}
                    onChange={(e) => setEditForm({ ...editForm, ea_id: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Admin Flags */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Admin Controls</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Verified User</Label>
                  <input
                    type="checkbox"
                    checked={editForm.is_verified}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Can Host Tournaments</Label>
                  <input
                    type="checkbox"
                    checked={editForm.can_host_tournaments}
                    onChange={(e) => setEditForm({ ...editForm, can_host_tournaments: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Banned</Label>
                  <input
                    type="checkbox"
                    checked={editForm.is_banned}
                    onChange={(e) => setEditForm({ ...editForm, is_banned: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {editForm.is_banned && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Ban Reason</Label>
                    <Textarea
                      value={editForm.ban_reason}
                      onChange={(e) => setEditForm({ ...editForm, ban_reason: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Ban Expires At</Label>
                    <Input
                      type="datetime-local"
                      value={editForm.ban_expires_at}
                      onChange={(e) => setEditForm({ ...editForm, ban_expires_at: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-slate-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <History className="w-5 h-5 mr-2" />
              User History - {selectedProfile?.display_name || selectedProfile?.full_name || "Unknown"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="edits" className="space-y-4">
            <TabsList className="bg-slate-700 border-slate-600">
              <TabsTrigger value="edits" className="data-[state=active]:bg-slate-600">
                Edit History
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-slate-600">
                Payment History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edits" className="space-y-3">
              {editHistory.length > 0 ? (
                editHistory.map((edit) => (
                  <div key={edit.id} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">{edit.field_name}</span>
                        {edit.edited_by && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            Admin Edit
                          </Badge>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm">{formatDate(edit.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Old Value:</span>
                        <p className="text-white bg-slate-600 p-2 rounded mt-1">{edit.old_value || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">New Value:</span>
                        <p className="text-white bg-slate-600 p-2 rounded mt-1">{edit.new_value || "Not set"}</p>
                      </div>
                    </div>
                    {edit.edit_reason && (
                      <div className="mt-2">
                        <span className="text-gray-400 text-sm">Reason:</span>
                        <p className="text-gray-300 text-sm">{edit.edit_reason}</p>
                      </div>
                    )}
                    {edit.edited_by_profile && (
                      <div className="mt-2">
                        <span className="text-gray-400 text-sm">Edited by:</span>
                        <span className="text-white text-sm ml-2">
                          {edit.edited_by_profile.full_name || edit.edited_by_profile.username}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No edit history found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-3">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <div key={payment.id} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">{payment.payment_type}</span>
                        <Badge
                          className={
                            payment.status === "completed"
                              ? "bg-green-600"
                              : payment.status === "failed"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <span className="text-gray-400 text-sm">{formatDate(payment.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <p className="text-white">
                          {payment.amount} {payment.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Tournament:</span>
                        <p className="text-white">{payment.tournaments?.title || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Method:</span>
                        <p className="text-white">{payment.payment_method || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              Ban User - {selectedProfile?.display_name || selectedProfile?.full_name || "Unknown"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white">Ban Reason</Label>
              <Textarea
                placeholder="Enter reason for ban..."
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
                onChange={(e) => setEditForm({ ...editForm, ban_reason: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-white">Ban Expires At (Optional)</Label>
              <Input
                type="datetime-local"
                className="bg-slate-700 border-slate-600 text-white"
                onChange={(e) => setEditForm({ ...editForm, ban_expires_at: e.target.value })}
              />
              <p className="text-gray-400 text-sm mt-1">Leave empty for permanent ban</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setBanDialogOpen(false)}
                className="border-slate-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleBanUser(selectedProfile?.id, editForm.ban_reason, editForm.ban_expires_at || null)}
                className="bg-red-600 hover:bg-red-700"
              >
                Ban User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
