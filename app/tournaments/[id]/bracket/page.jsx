import { createClient } from "@/lib/supabase/server"
import { TournamentBracket } from "@/components/tournament-bracket"
import Header from "@/components/header"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function TournamentBracketPage({ params }) {
  const supabase = createClient()
  let tournament = null
  let user = null

  try {
    // Try to get user first
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user

    // Try to fetch tournament from database
    const { data: tournamentData, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        profiles:created_by (
          username,
          full_name
        ),
        tournament_participants (
          id,
          user_id,
          joined_at,
          profiles:user_id (
            username,
            full_name
          )
        ),
        matches (
          *,
          player1:player1_id (
            username,
            full_name
          ),
          player2:player2_id (
            username,
            full_name
          ),
          winner:winner_id (
            username,
            full_name
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (!error && tournamentData) {
      tournament = tournamentData
    }
  } catch (error) {
    console.log("Database error, using fallback data:", error.message)
  }

  if (!tournament) {
    // Create fallback tournament data based on ID
    const fallbackTournaments = {
      1: {
        id: 1,
        name: "Street Fighter 6 Championship",
        game: "Street Fighter 6",
        status: "ongoing",
        max_participants: 16,
        current_participants: 16,
        prize_pool: 5000,
        start_date: "2024-01-15T10:00:00Z",
        created_by: "organizer-1",
        profiles: { username: "tournament_master", full_name: "Tournament Master" },
        tournament_participants: Array.from({ length: 16 }, (_, i) => ({
          id: i + 1,
          user_id: `player-${i + 1}`,
          joined_at: "2024-01-10T10:00:00Z",
          profiles: { username: `player${i + 1}`, full_name: `Player ${i + 1}` },
        })),
        matches: [
          // Quarter Finals
          {
            id: 1,
            tournament_id: 1,
            round: 1,
            match_number: 1,
            player1_id: "player-1",
            player2_id: "player-2",
            winner_id: "player-1",
            status: "completed",
            player1: { username: "player1", full_name: "Player 1" },
            player2: { username: "player2", full_name: "Player 2" },
            winner: { username: "player1", full_name: "Player 1" },
          },
          {
            id: 2,
            tournament_id: 1,
            round: 1,
            match_number: 2,
            player1_id: "player-3",
            player2_id: "player-4",
            winner_id: "player-3",
            status: "completed",
            player1: { username: "player3", full_name: "Player 3" },
            player2: { username: "player4", full_name: "Player 4" },
            winner: { username: "player3", full_name: "Player 3" },
          },
          // Semi Finals
          {
            id: 3,
            tournament_id: 1,
            round: 2,
            match_number: 1,
            player1_id: "player-1",
            player2_id: "player-3",
            winner_id: "player-1",
            status: "completed",
            player1: { username: "player1", full_name: "Player 1" },
            player2: { username: "player3", full_name: "Player 3" },
            winner: { username: "player1", full_name: "Player 1" },
          },
          // Finals
          {
            id: 4,
            tournament_id: 1,
            round: 3,
            match_number: 1,
            player1_id: "player-1",
            player2_id: "player-5",
            winner_id: "player-1",
            status: "completed",
            player1: { username: "player1", full_name: "Player 1" },
            player2: { username: "player5", full_name: "Player 5" },
            winner: { username: "player1", full_name: "Player 1" },
          },
        ],
      },
      2: {
        id: 2,
        name: "League of Legends World Cup",
        game: "League of Legends",
        status: "ongoing",
        max_participants: 8,
        current_participants: 8,
        prize_pool: 10000,
        start_date: "2024-01-20T14:00:00Z",
        created_by: "organizer-2",
        profiles: { username: "esports_admin", full_name: "Esports Admin" },
        tournament_participants: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          user_id: `team-${i + 1}`,
          joined_at: "2024-01-15T10:00:00Z",
          profiles: { username: `team${i + 1}`, full_name: `Team ${i + 1}` },
        })),
        matches: [
          // Quarter Finals
          {
            id: 5,
            tournament_id: 2,
            round: 1,
            match_number: 1,
            player1_id: "team-1",
            player2_id: "team-2",
            winner_id: "team-1",
            status: "completed",
            player1: { username: "team1", full_name: "Team 1" },
            player2: { username: "team2", full_name: "Team 2" },
            winner: { username: "team1", full_name: "Team 1" },
          },
          {
            id: 6,
            tournament_id: 2,
            round: 1,
            match_number: 2,
            player1_id: "team-3",
            player2_id: "team-4",
            winner_id: "team-4",
            status: "completed",
            player1: { username: "team3", full_name: "Team 3" },
            player2: { username: "team4", full_name: "Team 4" },
            winner: { username: "team4", full_name: "Team 4" },
          },
          // Semi Finals
          {
            id: 7,
            tournament_id: 2,
            round: 2,
            match_number: 1,
            player1_id: "team-1",
            player2_id: "team-4",
            winner_id: "team-1",
            status: "ongoing",
            player1: { username: "team1", full_name: "Team 1" },
            player2: { username: "team4", full_name: "Team 4" },
            winner: null,
          },
        ],
      },
    }

    tournament = fallbackTournaments[params.id]

    if (!tournament) {
      // Create a default tournament if ID doesn't match
      tournament = {
        id: Number.parseInt(params.id),
        name: `Tournament ${params.id}`,
        game: "eFootball 2026",
        status: "upcoming",
        max_participants: 16,
        current_participants: 8,
        prize_pool: 2500,
        start_date: "2024-02-01T16:00:00Z",
        created_by: "organizer-default",
        profiles: { username: "tournament_host", full_name: "Tournament Host" },
        tournament_participants: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          user_id: `participant-${i + 1}`,
          joined_at: "2024-01-25T10:00:00Z",
          profiles: { username: `participant${i + 1}`, full_name: `Participant ${i + 1}` },
        })),
        matches: [],
      }
    }
  }

  const isOrganizer = tournament.created_by === user?.id

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-900 pt-20 py-8">
        {!tournament.profiles && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
            <p className="text-amber-300 text-sm">
              ⚠️ Database not available. Showing sample bracket data for demonstration.
            </p>
          </div>
        )}

        <div className="mb-8">
          <Link href={`/tournaments/${tournament.id}`}>
            <Button variant="ghost" className="text-gray-300 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{tournament.name}</h1>
          <p className="text-gray-400">Tournament Bracket</p>
        </div>

        <TournamentBracket tournament={tournament} isOrganizer={isOrganizer} />
      </div>
    </>
  )
}
