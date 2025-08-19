"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Users, Trophy, Play, Eye } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

const fallbackTournaments = [
  {
    id: "1",
    name: "eFootball 2026 Championship",
    description: "Ultimate football tournament featuring the latest eFootball gameplay",
    game: "eFootball 2026",
    max_participants: 32,
    current_participants: 24,
    status: "upcoming",
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "75,000 TZS",
    entry_fee: "5,000 TZS",
  },
  {
    id: "2",
    name: "FC Mobile Pro League",
    description: "Mobile football championship for skilled players",
    game: "FC Mobile",
    max_participants: 64,
    current_participants: 47,
    status: "ongoing",
    start_date: new Date().toISOString(),
    prize_pool: "125,000 TZS",
    entry_fee: "7,500 TZS",
  },
  {
    id: "3",
    name: "eFootball 2026 Masters Cup",
    description: "Elite tournament for top eFootball players",
    game: "eFootball 2026",
    max_participants: 16,
    current_participants: 16,
    status: "ongoing",
    start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "200,000 TZS",
    entry_fee: "15,000 TZS",
  },
  {
    id: "4",
    name: "FC Mobile Weekend Tournament",
    description: "Quick mobile tournament for casual players",
    game: "FC Mobile",
    max_participants: 32,
    current_participants: 18,
    status: "upcoming",
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: "2,500 TZS",
  },
  {
    id: "5",
    name: "eFootball 2026 Youth League",
    description: "Tournament for young aspiring football gamers",
    game: "eFootball 2026",
    max_participants: 48,
    current_participants: 31,
    status: "upcoming",
    start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: "3,000 TZS",
  },
  {
    id: "6",
    name: "FC Mobile Champions Cup",
    description: "Premier mobile football championship",
    game: "FC Mobile",
    max_participants: 24,
    current_participants: 24,
    status: "completed",
    start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "150,000 TZS",
    entry_fee: "10,000 TZS",
  },
]

export function TournamentSection({ title, status, limit = 6 }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log(`[v0] TournamentSection rendering with title: "${title}", status: "${status}"`)

  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true)
        const supabase = createClient()
        const now = new Date().toISOString()

        let query = supabase
          .from("tournaments")
          .select(`
            id,
            title,
            description,
            game,
            max_participants,
            current_participants,
            status,
            start_date,
            prize_pool,
            entry_fee_amount,
            entry_fee_currency,
            created_at,
            organizer_id
          `)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (status === "upcoming") {
          query = query.gt("start_date", now).eq("status", "upcoming")
        } else if (status === "ongoing") {
          query = query.eq("status", "ongoing")
        } else if (status) {
          query = query.eq("status", status)
        }

        const result = await query

        if (result.error) {
          console.error("Tournament fetch error:", result.error)
          throw result.error
        }

        const fetchedTournaments = result.data?.filter((tournament) => tournament.organizer_id) || []
        setTournaments(fetchedTournaments)
        setError(null)
      } catch (e) {
        console.error("Database error fetching tournaments:", e.message)
        setError(e)
        setTournaments([])
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [status, limit])

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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">{title || "Tournaments"}</h2>
          <Link href="/tournaments">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
              Browse tournaments
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-400">Loading tournaments...</p>
          </div>
        )}

        {!loading && tournaments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No {title?.toLowerCase() || "tournaments"} available at the moment.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tournaments?.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-all duration-200 group"
            >
              <div className="relative">
                <img
                  src={`/abstract-geometric-shapes.png?height=200&width=400&query=${tournament.game} tournament`}
                  alt={tournament.title}
                  className="w-full h-32 md:h-48 object-cover"
                />
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                  <span
                    className={`text-xs text-white px-2 py-1 md:px-3 rounded-full font-medium ${getStatusColor(tournament.status)}`}
                  >
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </span>
                </div>
                {(tournament.status === "ongoing" || tournament.status === "completed") && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Link href={`/tournaments/${tournament.id}/bracket`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base">
                        <Play className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        View Bracket
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4">
                <Link href={`/tournaments/${tournament.id}`}>
                  <h3 className="font-semibold text-white text-sm md:text-base mb-2 line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer">
                    {tournament.title}
                  </h3>
                </Link>
                <div className="flex items-center text-xs md:text-sm text-gray-400 mb-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {formatDate(tournament.start_date)}
                </div>
                <div className="flex items-center text-xs md:text-sm text-gray-400 mb-3">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {tournament.current_participants}/{tournament.max_participants} players
                </div>

                <div className="flex items-center justify-between mt-3 md:mt-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent text-xs md:text-sm px-2 md:px-3"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </Link>
                    {(tournament.status === "ongoing" || tournament.status === "completed") && (
                      <Link href={`/tournaments/${tournament.id}/bracket`}>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm px-2 md:px-3">
                          <Play className="w-3 h-3 mr-1" />
                          Bracket
                        </Button>
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{tournament.game}</span>
                </div>

                {tournament.prize_pool && (
                  <div className="flex items-center text-xs md:text-sm text-gray-400 mt-2 pt-2 border-t border-slate-700">
                    <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>
                      {tournament.prize_pool}
                      {tournament.entry_fee_amount &&
                        tournament.entry_fee_currency &&
                        ` • Entry: ${tournament.entry_fee_amount} ${tournament.entry_fee_currency}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )) || []}
        </div>
      </div>
    </section>
  )
}
