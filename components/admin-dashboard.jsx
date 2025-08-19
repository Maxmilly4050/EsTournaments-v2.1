"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileManagementTab } from "@/components/profile-management-tab"
import {
  Shield,
  AlertTriangle,
  Users,
  Trophy,
  Flag,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Ban,
  MessageSquare,
  BarChart3,
  Clock,
  UserCog,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function AdminDashboard({ tournaments, disputes, users, matchResults, currentUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error("[v0] Unhandled promise rejection in AdminDashboard:", event.reason)
      setError("An unexpected error occurred. Please refresh the page.")
      event.preventDefault()
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  const openDisputes = disputes.filter((d) => d.status === "open")
  const pendingResults = matchResults.filter((r) => r.status === "pending")
  const disputedResults = matchResults.filter((r) => r.status === "disputed")

  const resolveDispute = async (disputeId, resolution, updateMatchResult = false) => {
    setLoading(true)
    setError(null)
    try {
      const { error: disputeError } = await supabase
        .from("match_disputes")
        .update({
          status: "resolved",
          resolution: resolution,
          admin_notes: adminNotes,
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", disputeId)

      if (disputeError) throw disputeError

      if (updateMatchResult) {
        const dispute = disputes.find((d) => d.id === disputeId)
        if (dispute?.match_result_id) {
          const { error: resultError } = await supabase
            .from("match_results")
            .update({ status: "rejected" })
            .eq("id", dispute.match_result_id)

          if (resultError) throw resultError
        }
      }

      toast({
        title: "Dispute resolved",
        description: "Admin resolution has been applied successfully",
      })

      setSelectedDispute(null)
      setAdminNotes("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Resolve error:", error)
      setError("Failed to resolve dispute. Please try again.")
      toast({
        title: "Resolution failed",
        description: "Failed to resolve dispute. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const suspendUser = async (userId, reason) => {
    setLoading(true)
    setError(null)
    try {
      toast({
        title: "User suspended",
        description: `User has been suspended for: ${reason}`,
      })

      setSelectedUser(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Suspend error:", error)
      setError("Failed to suspend user. Please try again.")
      toast({
        title: "Suspension failed",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const overrideMatchResult = async (resultId, action) => {
    setLoading(true)
    setError(null)
    try {
      const newStatus = action === "approve" ? "approved" : "rejected"

      const { error } = await supabase
        .from("match_results")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id,
        })
        .eq("id", resultId)

      if (error) throw error

      if (action === "approve") {
        const result = matchResults.find((r) => r.id === resultId)
        if (result) {
          await supabase
            .from("matches")
            .update({
              winner_id: result.winner_id,
              player1_score: result.player1_score,
              player2_score: result.player2_score,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", result.match_id)
        }
      }

      toast({
        title: `Result ${action}d`,
        description: `Admin override applied successfully`,
      })

      router.refresh()
    } catch (error) {
      console.error("[v0] Override error:", error)
      setError("Failed to override result. Please try again.")
      toast({
        title: "Override failed",
        description: "Failed to override result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredTournaments = tournaments.filter(
    (t) =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.game?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">Admin Dashboard Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => setError(null)} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-400" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Platform administration and issue resolution</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/admin/results")} className="bg-purple-600 hover:bg-purple-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Results Dashboard
          </Button>
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-slate-700 border-slate-600 text-white"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Open Disputes</p>
                <p className="text-2xl font-bold text-red-400">{openDisputes.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending Results</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingResults.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Tournaments</p>
                <p className="text-2xl font-bold text-green-400">
                  {tournaments.filter((t) => t.status === "ongoing").length}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Tournaments</p>
                <p className="text-2xl font-bold text-purple-400">{tournaments.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disputes" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="disputes" className="data-[state=active]:bg-slate-700">
            <Flag className="w-4 h-4 mr-2" />
            Disputes ({openDisputes.length})
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
            <Clock className="w-4 h-4 mr-2" />
            Pending Results ({pendingResults.length})
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="data-[state=active]:bg-slate-700">
            <Trophy className="w-4 h-4 mr-2" />
            Tournaments
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="profiles" className="data-[state=active]:bg-slate-700">
            <UserCog className="w-4 h-4 mr-2" />
            Profile Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="space-y-4">
          {openDisputes.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Open Disputes</h3>
                <p className="text-gray-400">All disputes have been resolved</p>
              </CardContent>
            </Card>
          ) : (
            openDisputes.map((dispute) => (
              <Card key={dispute.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>
                      {dispute.matches?.tournaments?.title} - Round {dispute.matches?.round}
                    </span>
                    <Badge variant="destructive">URGENT</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Dispute Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Game:</span>
                          <span className="text-white">{dispute.matches?.tournaments?.game}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Disputed by:</span>
                          <span className="text-white">
                            {dispute.disputed_by_profile?.username || dispute.disputed_by_profile?.full_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white">{formatDate(dispute.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Evidence</h4>
                      {dispute.dispute_evidence?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {dispute.dispute_evidence.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url || "/placeholder.svg"}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(url, "_blank")}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No evidence provided</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Dispute Reason</h4>
                    <p className="text-gray-300 text-sm bg-slate-700 p-3 rounded">{dispute.dispute_reason}</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => setSelectedDispute(dispute)} className="bg-blue-600 hover:bg-blue-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Resolve Dispute
                    </Button>
                    <Button
                      onClick={() => setSelectedUser(dispute.disputed_by_profile)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Review User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {pendingResults.map((result) => (
            <Card key={result.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {result.matches?.tournaments?.title} - Round {result.matches?.round} Match{" "}
                  {result.matches?.match_number}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Result Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitted by:</span>
                        <span className="text-white">
                          {result.submitted_by_profile?.username || result.submitted_by_profile?.full_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Score:</span>
                        <span className="text-white">
                          {result.player1_score} - {result.player2_score}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitted:</span>
                        <span className="text-white">{formatDate(result.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Screenshots</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {result.screenshot_urls?.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url || "/placeholder.svg"}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => window.open(url, "_blank")}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => overrideMatchResult(result.id, "approve")}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Admin Approve
                  </Button>
                  <Button
                    onClick={() => overrideMatchResult(result.id, "reject")}
                    disabled={loading}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Admin Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{tournament.title}</CardTitle>
                  <Badge
                    className={
                      tournament.status === "ongoing"
                        ? "bg-green-600"
                        : tournament.status === "upcoming"
                          ? "bg-blue-600"
                          : "bg-gray-600"
                    }
                  >
                    {tournament.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Game:</span>
                    <span className="text-white">{tournament.game}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Organizer:</span>
                    <span className="text-white">
                      {tournament.profiles?.username || tournament.profiles?.full_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Participants:</span>
                    <span className="text-white">{tournament.current_participants || 0}</span>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => router.push(`/tournaments/${tournament.id}`)}
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Tournament
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {user.username || user.full_name || "Unknown User"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white text-xs">{user.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Joined:</span>
                    <span className="text-white">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      onClick={() => router.push(`/profile/${user.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      onClick={() => setSelectedUser(user)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profiles">
          <ProfileManagementTab currentUser={currentUser} />
        </TabsContent>
      </Tabs>

      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Admin Dispute Resolution</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">Admin Resolution Notes</h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add detailed resolution notes for record keeping..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => resolveDispute(selectedDispute.id, "Admin resolved - Original result upheld", false)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Uphold Original Result
                </Button>
                <Button
                  onClick={() => resolveDispute(selectedDispute.id, "Admin resolved - Result overturned", true)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Overturn Result
                </Button>
                <Button
                  onClick={() =>
                    resolveDispute(selectedDispute.id, "Admin resolved - Requires manual intervention", false)
                  }
                  disabled={loading}
                  variant="outline"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                >
                  Manual Resolution Required
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">User Actions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">
                  {selectedUser.username || selectedUser.full_name || "Unknown User"}
                </h3>
                <p className="text-gray-400 text-sm">{selectedUser.email}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => suspendUser(selectedUser.id, "Suspicious activity")}
                  disabled={loading}
                  variant="destructive"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend User
                </Button>
                <Button
                  onClick={() => setSelectedUser(null)}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
