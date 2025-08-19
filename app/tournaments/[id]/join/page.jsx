import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import TournamentJoinForm from "@/components/tournament-join-form"
import Header from "@/components/header"

export default async function JoinTournamentPage({ params }) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch tournament details
  let tournament = null
  try {
    const { data: tournamentData, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        profiles:organizer_id (
          username,
          full_name
        ),
        tournament_participants (
          user_id
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      notFound()
    }

    tournament = tournamentData
  } catch (error) {
    notFound()
  }

  // Check if user is already a participant
  const isAlreadyParticipant = tournament.tournament_participants?.some(
    (participant) => participant.user_id === user.id,
  )

  if (isAlreadyParticipant) {
    redirect(`/tournaments/${params.id}`)
  }

  // Check if tournament is full
  const isFull = tournament.participant_count >= tournament.max_participants

  // Check if registration is still open
  const registrationDeadline = new Date(tournament.registration_deadline)
  const isRegistrationClosed = new Date() > registrationDeadline

  return (
    <>
      <Header />
      <div
        className="min-h-screen pt-20 py-12 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('/efootball-2026-cover.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Join Tournament</h1>
              <p className="text-gray-300 text-lg">Complete your registration and payment to join the competition</p>
            </div>

            {/* Tournament Info Card */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-6 mb-8 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">{tournament.title}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Game:</span>
                  <span className="text-white ml-2">{tournament.game}</span>
                </div>
                <div>
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-green-400 ml-2 font-bold">
                    Tsh {(tournament.entry_fee * 2500).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-yellow-400 ml-2 font-bold">
                    Tsh {(tournament.prize_pool * 2500).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white ml-2">
                    {tournament.participant_count}/{tournament.max_participants}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Status Checks */}
            {isFull ? (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-red-400 mb-2">Tournament Full</h3>
                <p className="text-gray-300">This tournament has reached its maximum number of participants.</p>
              </div>
            ) : isRegistrationClosed ? (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Registration Closed</h3>
                <p className="text-gray-300">Registration deadline has passed for this tournament.</p>
              </div>
            ) : (
              <TournamentJoinForm tournament={tournament} user={user} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
