import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TournamentDetails } from "@/components/tournament-details"
import { Header } from "@/components/header"

const getFallbackTournament = (id) => {
  const fallbackTournaments = [
    {
      id: "1",
      title: "Street Fighter 6 Championship",
      game: "Street Fighter 6",
      description: "The ultimate fighting game tournament featuring the best players from around the world.",
      max_participants: 32,
      participant_count: 24,
      start_date: "2024-02-15T18:00:00Z",
      end_date: "2024-02-16T22:00:00Z",
      registration_deadline: "2024-02-14T23:59:59Z",
      prize_pool: 5000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer1",
      created_at: "2024-01-15T10:00:00Z",
      profiles: {
        username: "tournament_master",
        full_name: "Tournament Master",
      },
      tournament_participants: [
        {
          id: "1",
          user_id: "user1",
          joined_at: "2024-01-16T10:00:00Z",
          profiles: {
            username: "fighter_pro",
            full_name: "Pro Fighter",
          },
        },
        {
          id: "2",
          user_id: "user2",
          joined_at: "2024-01-17T14:30:00Z",
          profiles: {
            username: "combo_king",
            full_name: "Combo King",
          },
        },
      ],
    },
    {
      id: "2",
      title: "Tekken 8 World Series",
      game: "Tekken 8",
      description: "Join the most competitive Tekken 8 tournament with players from across the globe.",
      max_participants: 64,
      participant_count: 45,
      start_date: "2024-02-20T16:00:00Z",
      end_date: "2024-02-21T20:00:00Z",
      registration_deadline: "2024-02-19T23:59:59Z",
      prize_pool: 8000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer2",
      created_at: "2024-01-20T12:00:00Z",
      profiles: {
        username: "tekken_admin",
        full_name: "Tekken Admin",
      },
      tournament_participants: [
        {
          id: "3",
          user_id: "user3",
          joined_at: "2024-01-21T09:15:00Z",
          profiles: {
            username: "iron_fist",
            full_name: "Iron Fist",
          },
        },
        {
          id: "4",
          user_id: "user4",
          joined_at: "2024-01-22T16:45:00Z",
          profiles: {
            username: "devil_jin",
            full_name: "Devil Jin",
          },
        },
      ],
    },
    {
      id: "3",
      title: "Mortal Kombat 1 Fatality Cup",
      game: "Mortal Kombat 1",
      description: "Experience the brutality of Mortal Kombat 1 in this intense tournament.",
      max_participants: 16,
      participant_count: 12,
      start_date: "2024-02-25T19:00:00Z",
      end_date: "2024-02-25T23:00:00Z",
      registration_deadline: "2024-02-24T23:59:59Z",
      prize_pool: 3000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer3",
      created_at: "2024-01-25T15:30:00Z",
      profiles: {
        username: "mk_master",
        full_name: "MK Master",
      },
      tournament_participants: [
        {
          id: "5",
          user_id: "user5",
          joined_at: "2024-01-26T11:20:00Z",
          profiles: {
            username: "scorpion_main",
            full_name: "Scorpion Main",
          },
        },
      ],
    },
    {
      id: "4",
      title: "Counter-Strike 2 Major",
      game: "Counter-Strike 2",
      description: "The premier Counter-Strike 2 tournament featuring top teams from around the world.",
      max_participants: 16,
      participant_count: 14,
      start_date: "2024-03-01T17:00:00Z",
      end_date: "2024-03-03T21:00:00Z",
      registration_deadline: "2024-02-28T23:59:59Z",
      prize_pool: 15000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer4",
      created_at: "2024-02-01T09:00:00Z",
      profiles: {
        username: "cs_admin",
        full_name: "CS Admin",
      },
      tournament_participants: [
        {
          id: "6",
          user_id: "user6",
          joined_at: "2024-02-02T10:30:00Z",
          profiles: {
            username: "awp_master",
            full_name: "AWP Master",
          },
        },
        {
          id: "7",
          user_id: "user7",
          joined_at: "2024-02-03T14:15:00Z",
          profiles: {
            username: "clutch_king",
            full_name: "Clutch King",
          },
        },
      ],
    },
    {
      id: "5",
      title: "Valorant Champions League",
      game: "Valorant",
      description: "Elite Valorant tournament showcasing the best tactical FPS gameplay.",
      max_participants: 32,
      participant_count: 28,
      start_date: "2024-03-05T18:00:00Z",
      end_date: "2024-03-07T22:00:00Z",
      registration_deadline: "2024-03-04T23:59:59Z",
      prize_pool: 12000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer5",
      created_at: "2024-02-05T11:00:00Z",
      profiles: {
        username: "val_organizer",
        full_name: "Valorant Organizer",
      },
      tournament_participants: [
        {
          id: "8",
          user_id: "user8",
          joined_at: "2024-02-06T13:45:00Z",
          profiles: {
            username: "sage_main",
            full_name: "Sage Main",
          },
        },
      ],
    },
    {
      id: "6",
      title: "League of Legends World Cup",
      game: "League of Legends",
      description: "The ultimate MOBA tournament featuring the world's best League of Legends teams.",
      max_participants: 64,
      participant_count: 52,
      start_date: "2024-03-10T16:00:00Z",
      end_date: "2024-03-12T20:00:00Z",
      registration_deadline: "2024-03-09T23:59:59Z",
      prize_pool: 25000,
      status: "open",
      format: "single_elimination",
      created_by: "organizer6",
      created_at: "2024-02-10T08:30:00Z",
      profiles: {
        username: "lol_master",
        full_name: "LoL Master",
      },
      tournament_participants: [
        {
          id: "9",
          user_id: "user9",
          joined_at: "2024-02-11T15:20:00Z",
          profiles: {
            username: "yasuo_god",
            full_name: "Yasuo God",
          },
        },
        {
          id: "10",
          user_id: "user10",
          joined_at: "2024-02-12T09:10:00Z",
          profiles: {
            username: "support_carry",
            full_name: "Support Carry",
          },
        },
        {
          id: "11",
          user_id: "user11",
          joined_at: "2024-02-13T17:30:00Z",
          profiles: {
            username: "jungle_diff",
            full_name: "Jungle Diff",
          },
        },
      ],
    },
  ]

  const exactMatch = fallbackTournaments.find((t) => t.id === id)
  if (exactMatch) {
    return exactMatch
  }

  // If no exact match found, return the first tournament as a fallback
  // but update its ID to match the requested ID
  const defaultTournament = { ...fallbackTournaments[0] }
  defaultTournament.id = id
  defaultTournament.title = `Tournament #${id}`
  defaultTournament.description = `Sample tournament data for tournament ID ${id}. This is placeholder content while the database is being set up.`

  return defaultTournament
}

export default async function TournamentPage({ params }) {
  // Only redirect if the ID is not numeric (but allow "create" to pass through to 404)
  if (isNaN(Number(params.id))) {
    redirect("/tournaments")
  }

  const supabase = createClient()
  let tournament = null
  let user = null
  let usingFallback = false

  try {
    const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      // Tables don't exist, use fallback data
      tournament = getFallbackTournament(params.id)
      usingFallback = true
    } else {
      const { data: tournamentData, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) {
        console.error("Database query error:", error)
        // If tournament not found in database, try fallback
        tournament = getFallbackTournament(params.id)
        usingFallback = true
      } else {
        // Get organizer profile separately
        const { data: organizerProfile } = await supabase
          .from("profiles")
          .select("username, full_name")
          .eq("id", tournamentData.organizer_id)
          .single()

        // Get tournament participants separately
        const { data: participants } = await supabase
          .from("tournament_participants")
          .select("id, user_id, joined_at")
          .eq("tournament_id", params.id)

        // Get participant profiles
        let participantProfiles = []
        if (participants && participants.length > 0) {
          const userIds = participants.map((p) => p.user_id)
          const { data: profiles } = await supabase.from("profiles").select("id, username, full_name").in("id", userIds)

          participantProfiles = participants.map((participant) => ({
            ...participant,
            profiles: profiles?.find((profile) => profile.id === participant.user_id) || null,
          }))
        }

        tournament = {
          ...tournamentData,
          profiles: organizerProfile,
          tournament_participants: participantProfiles,
        }
      }
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      user = userData.user
    } catch (authError) {
      // User not authenticated, continue without user data
      user = null
    }
  } catch (error) {
    tournament = getFallbackTournament(params.id)
    usingFallback = true
  }

  if (!tournament) {
    redirect("/tournaments")
  }

  const isParticipant =
    tournament.tournament_participants?.some((participant) => participant.user_id === user?.id) || false

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="py-12">
        <div className="container mx-auto px-4">
          {usingFallback && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ Database tables not found. Showing sample tournament data. Please run the SQL setup scripts to enable
                full functionality.
              </p>
            </div>
          )}
          <TournamentDetails tournament={tournament} user={user} isParticipant={isParticipant} />
        </div>
      </div>
    </div>
  )
}
