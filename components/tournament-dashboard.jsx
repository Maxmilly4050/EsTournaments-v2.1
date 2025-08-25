"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Send, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export function TournamentDashboard({ tournament, matchResults, disputes, user, isAdmin = false }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showScreenshots, setShowScreenshots] = useState(false)
  const [adminDecision, setAdminDecision] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [currentTournament, setCurrentTournament] = useState(tournament)
  const [isSeeding, setIsSeeding] = useState(false)

  // Function to refresh dashboard data
  const refreshDashboardData = useCallback(async () => {
    // Allow callers to await a full data reload
    window.location.reload()
  }, [])

  const handleResolveDispute = async (disputeId, decision) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: 'resolved', resolution: decision })
        .eq('id', disputeId)

      if (error) throw error

      toast.success('Dispute resolved successfully')
      refreshDashboardData()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast.error('Failed to resolve dispute')
    }
  }

  const handleInvitePlayer = async (email) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: currentTournament.id,
          user_id: null, // Will be filled when user accepts
          status: 'invited',
          invited_email: email
        })

      if (error) throw error

      toast.success('Player invited successfully')
    } catch (error) {
      console.error('Error inviting player:', error)
      toast.error('Failed to invite player')
    }
  }

  const generateBracket = async () => {
    setIsSeeding(true)
    const supabase = createClient()

    try {
      const response = await fetch(`/api/tournaments/${currentTournament.id}/generate-bracket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate bracket')
      }

      toast.success('Tournament bracket generated successfully!')
      refreshDashboardData()
    } catch (error) {
      console.error('Error generating bracket:', error)
      toast.error(error.message || 'Failed to generate bracket')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>{currentTournament?.title || 'Tournament Dashboard'}</span>
            <Badge variant={currentTournament?.status === 'active' ? 'success' : 'secondary'}>
              {currentTournament?.status || 'Unknown'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Game</p>
              <p className="font-semibold">{currentTournament?.game || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Format</p>
              <p className="font-semibold">{currentTournament?.tournament_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Participants</p>
              <p className="font-semibold">
                {currentTournament?.current_participants || 0}/{currentTournament?.max_participants || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="font-semibold">{currentTournament?.prize_pool || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Players
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Player email"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInvitePlayer(e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input')
                    handleInvitePlayer(input.value)
                    input.value = ''
                  }}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {isAdmin && (
          <Button
            onClick={generateBracket}
            disabled={isSeeding}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSeeding ? 'Generating...' : 'Generate Bracket'}
          </Button>
        )}
      </div>

      {/* Match Results */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Recent Match Results
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScreenshots(!showScreenshots)}
            >
              {showScreenshots ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showScreenshots ? 'Hide' : 'Show'} Screenshots
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {matchResults && matchResults.length > 0 ? (
              matchResults.map((match) => (
                <div key={match.id} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      Round {match.round} - Match {match.match_number}
                    </span>
                    <Badge variant={match.status === 'completed' ? 'success' : 'secondary'}>
                      {match.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className={`${match.winner_id === match.player1_id ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                      {match.player1?.username || match.player1?.full_name || 'Player 1'}
                      {match.player1_score !== null && ` (${match.player1_score})`}
                    </div>
                    <div className={`${match.winner_id === match.player2_id ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                      {match.player2?.username || match.player2?.full_name || 'Player 2'}
                      {match.player2_score !== null && ` (${match.player2_score})`}
                    </div>
                  </div>
                  {showScreenshots && match.screenshot_url && (
                    <div className="mt-2">
                      <img
                        src={match.screenshot_url}
                        alt="Match screenshot"
                        className="max-w-full h-32 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No match results yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disputes Section */}
      {isAdmin && disputes && disputes.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Pending Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      Match {dispute.match?.match_number} Dispute
                    </span>
                    <Badge variant="destructive">{dispute.status}</Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{dispute.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolveDispute(dispute.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleResolveDispute(dispute.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
