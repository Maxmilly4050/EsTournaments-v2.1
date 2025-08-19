"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Trophy, Clock, DollarSign, User, BracketsIcon as Bracket } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { TournamentBracket } from "./tournament-bracket"

export function TournamentDetails({ tournament, user, isParticipant }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isParticipant)
  const [error, setError] = useState(null)

  const actualParticipantCount = tournament.tournament_participants?.length || tournament.current_participants || 0

  const handleJoinTournament = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: tableCheckError } = await supabase.from("tournament_participants").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        setError("Database not configured. Please run the SQL setup scripts first.")
        return
      }

      const { error } = await supabase.from("tournament_participants").insert([
        {
          tournament_id: tournament.id,
          user_id: user.id,
        },
      ])

      if (error) {
        console.error("Error joining tournament:", error)
        setError("Failed to join tournament. Please try again.")
      } else {
        setJoined(true)
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveTournament = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const { error: tableCheckError } = await supabase.from("tournament_participants").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        setError("Database not configured. Please run the SQL setup scripts first.")
        return
      }

      const { error } = await supabase
        .from("tournament_participants")
        .delete()
        .eq("tournament_id", tournament.id)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error leaving tournament:", error)
        setError("Failed to leave tournament. Please try again.")
      } else {
        setJoined(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-600"
      case "ongoing":
        return "bg-green-600"
      case "completed":
        return "bg-gray-600"
      default:
        return "bg-blue-600"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "TBD"
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const canJoin = tournament.status === "upcoming" && actualParticipantCount < tournament.max_participants
  const isOrganizer = tournament.created_by === user?.id || tournament.organizer_id === user?.id

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">{tournament.name}</h1>
        <Badge className={`${getStatusColor(tournament.status)} text-white`}>
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </Badge>
      </div>

      {/* Tournament Image */}
      <div className="w-full h-64 rounded-lg overflow-hidden">
        <img
          src={`/abstract-geometric-shapes.png?height=300&width=800&query=${tournament.game} tournament banner`}
          alt={tournament.name}
          className="w-full h-full object-cover"
        />
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">About This Tournament</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{tournament.description || "No description provided."}</p>
            </CardContent>
          </Card>

          {/* Bracket Preview */}
          <TournamentBracket tournament={tournament} currentUser={user} />

          {/* Participants */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({actualParticipantCount}/{tournament.max_participants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournament.tournament_participants && tournament.tournament_participants.length > 0 ? (
                  tournament.tournament_participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {participant.profiles?.username || participant.profiles?.full_name || `Player ${index + 1}`}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Joined {new Date(participant.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 col-span-2 text-center py-8">
                    {actualParticipantCount > 0
                      ? `${actualParticipantCount} participants registered`
                      : "No participants yet. Be the first to join!"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 space-y-3">
              {(tournament.status === "ongoing" || tournament.status === "completed") && (
                <Link href={`/tournaments/${tournament.id}/bracket`}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Bracket className="w-4 h-4 mr-2" />
                    View Bracket
                  </Button>
                </Link>
              )}

              {isOrganizer && (
                <Link href={`/tournaments/${tournament.id}/dashboard`}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Trophy className="w-4 h-4 mr-2" />
                    Tournament Dashboard
                  </Button>
                </Link>
              )}

              {joined ? (
                <Button onClick={handleLeaveTournament} disabled={loading} variant="destructive" className="w-full">
                  {loading ? "Leaving..." : "Leave Tournament"}
                </Button>
              ) : canJoin ? (
                <Button
                  onClick={handleJoinTournament}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Joining..." : "Join Tournament"}
                </Button>
              ) : (
                <Button disabled className="w-full">
                  {actualParticipantCount >= tournament.max_participants ? "Tournament Full" : "Registration Closed"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tournament Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Start Date</p>
                  <p className="text-gray-400 text-sm">{formatDate(tournament.start_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">End Date</p>
                  <p className="text-gray-400 text-sm">{formatDate(tournament.end_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Format</p>
                  <p className="text-gray-400 text-sm">
                    {tournament.tournament_type?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
                      "Single Elimination"}
                  </p>
                </div>
              </div>

              {tournament.prize_pool && (
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">Prize Pool</p>
                    <p className="text-gray-400 text-sm">{tournament.prize_pool}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Entry Fee</p>
                  <p className="text-gray-400 text-sm">{tournament.entry_fee}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Game</p>
                  <p className="text-gray-400 text-sm">{tournament.game}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizer */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {tournament.profiles?.username || tournament.profiles?.full_name || "Unknown"}
                  </p>
                  <p className="text-gray-400 text-sm">Tournament Organizer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
