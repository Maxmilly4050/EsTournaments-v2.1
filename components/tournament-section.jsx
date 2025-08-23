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

        // Add safety check for Supabase client
        if (!supabase || !supabase.from) {
          console.error('[v0] Supabase client not properly initialized')
          throw new Error('Database connection failed')
        }

        const now = new Date().toISOString()

        console.log(`[v0] Fetching tournaments with status: "${status}", limit: ${limit}`)

        // Initialize query with safety checks
        let query = supabase.from("tournaments")

        if (!query || !query.select) {
          console.error('[v0] Failed to create tournaments query')
          throw new Error('Query initialization failed')
        }

        query = query.select(`
            id,
            description,
            game,
            max_participants,
            current_participants,
            status,
            start_date,
            end_date,
            prize_pool,
            entry_fee_amount,
            entry_fee_currency,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(limit)

        // Add safety checks for query chaining operations
        try {
          if (status === "upcoming") {
            if (query && query.gt && query.eq) {
              query = query.gt("start_date", now).eq("status", "upcoming")
            } else {
              console.warn('[v0] Query methods missing for upcoming status filter')
            }
          } else if (status === "ongoing") {
            if (query && query.eq) {
              query = query.eq("status", "ongoing")
            } else {
              console.warn('[v0] Query eq method missing for ongoing status filter')
            }
          } else if (status && typeof status === 'string') {
            if (query && query.eq) {
              query = query.eq("status", status)
            } else {
              console.warn('[v0] Query eq method missing for status filter')
            }
          }
        } catch (queryError) {
          console.error('[v0] Error during query building:', queryError?.message || queryError?.toString?.() || String(queryError) || 'Unknown error')
          // Continue with base query without status filtering
        }

        const result = await query

        if (result.error) {
          console.error("[v0] Supabase query error:", result.error)
          throw result.error
        }

        console.log(`[v0] Raw tournaments fetched: ${result.data?.length || 0}`)

        // Safe filtering with null checks
        let fetchedTournaments = []
        if (result.data && Array.isArray(result.data)) {
          fetchedTournaments = result.data.filter((tournament) => {
            // Add safety check for tournament structure
            if (!tournament || typeof tournament !== 'object') {
              console.warn('[v0] Invalid tournament object:', tournament)
              return false
            }
            return true // include all valid tournaments
          })
        }

        console.log(`[v0] Filtered tournaments (with creators): ${fetchedTournaments.length}`)

        // Safe tournament processing with individual error handling
        const processedTournaments = []
        fetchedTournaments.forEach((tournament, index) => {
          try {
            const processedTournament = {
              ...tournament,
              calculated_status: getCorrectTournamentStatus(tournament)
            }
            processedTournaments.push(processedTournament)
          } catch (processingError) {
            console.error(`[v0] Error processing tournament ${index} (${tournament?.id}):`, processingError?.message || processingError?.toString?.() || String(processingError) || 'Unknown error')
            // Still include the tournament but with fallback status
            processedTournaments.push({
              ...tournament,
              calculated_status: tournament.status || "upcoming"
            })
          }
        })

        // Safe status filtering with comprehensive error handling
        let finalTournaments = []
        try {
          // Add safety check for processedTournaments array
          if (!processedTournaments || !Array.isArray(processedTournaments)) {
            console.warn('[v0] processedTournaments is not a valid array, using empty array')
            finalTournaments = []
          } else {
            finalTournaments = processedTournaments.filter(tournament => {
              try {
                // Enhanced safety checks for tournament object
                if (!tournament || typeof tournament !== 'object') {
                  return false
                }

                // Safe property access with type checking
                let calculatedStatus
                try {
                  calculatedStatus = tournament.calculated_status
                } catch (propertyError) {
                  console.error(`[v0] Error accessing calculated_status for tournament ${tournament?.id}:`, propertyError?.message || propertyError?.toString?.() || String(propertyError) || 'Unknown error')
                  return false
                }

                if (!calculatedStatus || typeof calculatedStatus !== 'string') {
                  return false
                }

                // Safe status comparison
                if (status === "upcoming") {
                  return calculatedStatus === "upcoming"
                } else if (status === "ongoing") {
                  return calculatedStatus === "ongoing"
                } else if (status === "completed") {
                  return calculatedStatus === "completed"
                } else if (status && typeof status === 'string') {
                  return calculatedStatus === status
                }
                return true
              } catch (filterError) {
                console.error(`[v0] Error filtering tournament ${tournament?.id}:`, filterError?.message || filterError?.toString?.() || String(filterError) || 'Unknown error')
                return false // exclude problematic tournaments
              }
            })
          }
        } catch (filteringError) {
          console.error('[v0] Error in tournament filtering operation:', filteringError?.message || filteringError?.toString?.() || String(filteringError) || 'Unknown error')
          finalTournaments = [] // fallback to empty array
        }

        console.log(`[v0] Final filtered tournaments: ${finalTournaments.length}`)

        setTournaments(finalTournaments)
        setError(null)
      } catch (e) {
        // Enhanced error handling in catch block
        console.error("[v0] Database error fetching tournaments:", e)

        // Safe error logging and state updates
        try {
          const errorMessage = e?.message || e?.toString() || 'Unknown error'
          console.error("[v0] Error details:", errorMessage)
          setError(e)
        } catch (loggingError) {
          console.error("[v0] Error in error handling:", loggingError)
          setError(new Error('Failed to fetch tournaments'))
        }

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

  const getCorrectTournamentStatus = (tournament, now = new Date()) => {
    try {
      // Add safety checks for tournament data
      if (!tournament) {
        console.warn('[v0] Tournament data is null/undefined')
        return "upcoming"
      }

      // Validate and parse dates safely
      const startDate = tournament.start_date ? new Date(tournament.start_date) : null
      const endDate = tournament.end_date ? new Date(tournament.end_date) : null

      // Check for invalid dates
      if (startDate && isNaN(startDate.getTime())) {
        console.warn('[v0] Invalid start_date in tournament:', tournament.id, tournament.start_date)
        return tournament.status || "upcoming" // fallback to database status
      }

      if (endDate && isNaN(endDate.getTime())) {
        console.warn('[v0] Invalid end_date in tournament:', tournament.id, tournament.end_date)
        return tournament.status || "upcoming" // fallback to database status
      }

      // If no valid start date, use database status
      if (!startDate) {
        return tournament.status || "upcoming"
      }

      // Calculate status based on valid dates
      if (endDate && now > endDate) {
        return "completed"
      } else if (now >= startDate) {
        return "ongoing"
      } else {
        return "upcoming"
      }
    } catch (error) {
      console.error('[v0] Error in getCorrectTournamentStatus:', error?.message || error?.toString?.() || String(error) || 'Unknown error', tournament?.id)
      return tournament?.status || "upcoming" // safe fallback
    }
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {title ? title.split(' ').map((word, index) =>
              index === title.split(' ').length - 1 ?
                <span key={index} className="gradient-text">{word}</span> :
                <span key={index}>{word} </span>
            ) : "Tournaments"}
          </h2>
          <Link href="/tournaments">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover-lift" aria-label="Browse all tournaments">
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
                    className={`text-xs text-white px-2 py-1 md:px-3 rounded-full font-medium ${getStatusColor(tournament.calculated_status || tournament.status)}`}
                  >
                    {(tournament.calculated_status || tournament.status).charAt(0).toUpperCase() + (tournament.calculated_status || tournament.status).slice(1)}
                  </span>
                </div>
                {((tournament.calculated_status || tournament.status) === "ongoing" || (tournament.calculated_status || tournament.status) === "completed") && (
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
