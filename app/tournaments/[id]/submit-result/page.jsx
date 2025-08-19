import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import MatchResultSubmission from "@/components/match-result-submission"

export default async function SubmitResultPage({ params, searchParams }) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const matchId = searchParams.matchId
  if (!matchId) {
    redirect(`/tournaments/${params.id}`)
  }

  // Get match details with player information
  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, username, avatar_url),
      player2:profiles!matches_player2_id_fkey(id, username, avatar_url),
      tournament:tournaments(id, title, organizer_id)
    `)
    .eq("id", matchId)
    .single()

  if (error || !match) {
    redirect(`/tournaments/${params.id}`)
  }

  // Check if user is a participant in this match
  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    redirect(`/tournaments/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="pt-20 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Submit Match Result</h1>
            <p className="text-slate-400">
              Tournament: <span className="text-white">{match.tournament.title}</span>
            </p>
          </div>

          <MatchResultSubmission
            match={match}
            user={user}
            onSubmissionComplete={() => {
              // Redirect back to tournament page after successful submission
              window.location.href = `/tournaments/${params.id}`
            }}
          />
        </div>
      </div>
    </div>
  )
}
