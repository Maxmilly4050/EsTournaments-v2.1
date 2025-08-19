import { createClient } from "@/lib/supabase/server"
import { TournamentGrid } from "@/components/tournament-grid"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"

const fallbackTournaments = [
  {
    id: "1",
    name: "eFootball 2026 Championship",
    description: "Ultimate football tournament featuring the latest eFootball gameplay",
    game: "eFootball 2026",
    max_participants: 32,
    current_participants: 24,
    status: "upcoming",
    tournament_type: "single_elimination",
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "50,000 TZS",
    entry_fee: "5,000 TZS",
    created_at: new Date().toISOString(),
    profiles: {
      username: "efootball_master",
      full_name: "eFootball Master",
    },
  },
  {
    id: "2",
    name: "eFootball 2026 Pro League",
    description: "Professional eFootball competition with top players",
    game: "eFootball 2026",
    max_participants: 16,
    current_participants: 12,
    status: "ongoing",
    tournament_type: "single_elimination",
    start_date: new Date().toISOString(),
    prize_pool: "75,000 TZS",
    entry_fee: "10,000 TZS",
    created_at: new Date().toISOString(),
    profiles: {
      username: "efootball_admin",
      full_name: "eFootball Admin",
    },
  },
  {
    id: "3",
    name: "FC Mobile Masters Cup",
    description: "Mobile football championship for FC Mobile players",
    game: "FC Mobile",
    max_participants: 64,
    current_participants: 45,
    status: "upcoming",
    tournament_type: "single_elimination",
    start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "100,000 TZS",
    entry_fee: "7,500 TZS",
    created_at: new Date().toISOString(),
    profiles: {
      username: "fc_organizer",
      full_name: "FC Mobile Organizer",
    },
  },
  {
    id: "4",
    name: "FC Mobile Weekly Tournament",
    description: "Weekly FC Mobile competition with exciting prizes",
    game: "FC Mobile",
    max_participants: 32,
    current_participants: 28,
    status: "ongoing",
    tournament_type: "single_elimination",
    start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "25,000 TZS",
    entry_fee: "2,500 TZS",
    created_at: new Date().toISOString(),
    profiles: {
      username: "fc_master",
      full_name: "FC Master",
    },
  },
  {
    id: "5",
    name: "eFootball 2026 Rookie Cup",
    description: "Tournament for new eFootball players to compete",
    game: "eFootball 2026",
    max_participants: 24,
    current_participants: 18,
    status: "upcoming",
    tournament_type: "single_elimination",
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "30,000 TZS",
    entry_fee: "Free",
    created_at: new Date().toISOString(),
    profiles: {
      username: "efootball_rookie",
      full_name: "eFootball Rookie Admin",
    },
  },
  {
    id: "6",
    name: "FC Mobile Champions League",
    description: "Elite FC Mobile tournament for top players",
    game: "FC Mobile",
    max_participants: 16,
    current_participants: 16,
    status: "completed",
    tournament_type: "single_elimination",
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: "150,000 TZS",
    entry_fee: "15,000 TZS",
    created_at: new Date().toISOString(),
    profiles: {
      username: "fc_champion",
      full_name: "FC Champion",
    },
  },
]

export default async function TournamentsPage({ searchParams }) {
  const gameFilter = searchParams?.game
  const searchQuery = searchParams?.search
  const supabase = createClient()
  let tournaments = null
  let usingFallback = false

  try {
    const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      tournaments = fallbackTournaments
      usingFallback = true
    } else {
      let query = supabase.from("tournaments").select("*").order("created_at", { ascending: false })

      if (gameFilter) {
        const gameMap = {
          "efootball-2026": "eFootball 2026",
          "fc-mobile": "FC Mobile",
        }
        const gameName = gameMap[gameFilter]
        if (gameName) {
          query = query.eq("game", gameName)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("Database query error:", error)
        tournaments = fallbackTournaments
        usingFallback = true
      } else {
        const organizerIds = data.map((tournament) => tournament.organizer_id).filter(Boolean)
        let organizerProfiles = []

        if (organizerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, full_name")
            .in("id", organizerIds)

          organizerProfiles = profiles || []
        }

        tournaments = data.map((tournament) => ({
          ...tournament,
          profiles: organizerProfiles.find((profile) => profile.id === tournament.organizer_id) || null,
        }))
      }
    }
  } catch (error) {
    console.error("Database connection error:", error)
    tournaments = fallbackTournaments
    usingFallback = true
  }

  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase()
    tournaments = tournaments.filter(
      (tournament) =>
        (tournament.name && tournament.name.toLowerCase().includes(searchLower)) ||
        (tournament.description && tournament.description.toLowerCase().includes(searchLower)) ||
        (tournament.game && tournament.game.toLowerCase().includes(searchLower)),
    )
  }

  if (usingFallback && gameFilter) {
    const gameMap = {
      "efootball-2026": "eFootball 2026",
      "fc-mobile": "FC Mobile",
    }
    const gameName = gameMap[gameFilter]
    if (gameName) {
      tournaments = tournaments.filter((tournament) => tournament.game === gameName)
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const getPageContent = () => {
    if (searchQuery) {
      return {
        title: `Search Results for "${searchQuery}"`,
        description: `Found ${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""} matching your search`,
      }
    } else if (gameFilter === "efootball-2026") {
      return {
        title: "eFootball 2026 Tournaments",
        description: "Compete in eFootball 2026 tournaments and showcase your skills",
      }
    } else if (gameFilter === "fc-mobile") {
      return {
        title: "FC Mobile Tournaments",
        description: "Join FC Mobile tournaments and compete on the go",
      }
    }
    return {
      title: "All Tournaments",
      description: "Discover and join gaming tournaments",
    }
  }

  const { title, description } = getPageContent()

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="pt-20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              <p className="text-gray-400">{description}</p>
              {searchQuery && (
                <div className="flex items-center mt-2 text-sm text-blue-400">
                  <Search className="w-4 h-4 mr-1" />
                  Searching for: "{searchQuery}"
                  <Link href="/tournaments" className="ml-2 text-gray-400 hover:text-white">
                    (Clear search)
                  </Link>
                </div>
              )}
            </div>
            {user && (
              <Link href="/tournaments/create">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tournament
                </Button>
              </Link>
            )}
          </div>

          {usingFallback && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ Database tables not found. Showing sample tournament data. Please run the SQL setup scripts to enable
                full functionality.
              </p>
            </div>
          )}

          {searchQuery && tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tournaments found</h3>
              <p className="text-gray-400 mb-4">
                No tournaments match your search for "{searchQuery}". Try different keywords or browse all tournaments.
              </p>
              <Link href="/tournaments">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse All Tournaments</Button>
              </Link>
            </div>
          ) : (
            <TournamentGrid tournaments={tournaments || []} />
          )}
        </div>
      </div>
    </div>
  )
}
