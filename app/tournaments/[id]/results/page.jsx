"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ResultsManagement } from "@/components/results-management"
import Header from "@/components/header"

export default function ResultsManagementPage({ params }) {
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tournamentId, setTournamentId] = useState(null)

  // Handle async params resolution
  useEffect(() => {
    async function resolveParams() {
      try {
        // Handle params as promise in Next.js App Router
        const resolvedParams = await params
        const id = resolvedParams.id

        if (id === "create" || isNaN(Number.parseInt(id))) {
          router.push("/tournaments")
          return
        }

        setTournamentId(id)
      } catch (error) {
        console.error("[v0] Failed to resolve params:", error)
        router.push("/tournaments")
      }
    }

    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!tournamentId) return

    async function loadResultsData() {
      const supabase = createClient()

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        console.log("[v0] Results auth check:", { userData: !!userData?.user, error: userError?.message })

        if (userError || !userData?.user) {
          console.log("[v0] Auth failed, redirecting to login")
          router.push("/auth/login")
          return
        }

        const currentUser = userData.user
        setUser(currentUser)

        // Check if user is admin
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", currentUser.id)
          .single()

        const userIsAdmin = profileData?.is_admin || false
        setIsAdmin(userIsAdmin)

        // Check if tables exist
        const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          // Tables don't exist, use fallback data
          setTournament({
            id: tournamentId,
            title: `Tournament #${tournamentId}`,
            game: "Sample Game",
            organizer_id: currentUser.id,
            status: "ongoing",
          })
        } else {
          // Fetch tournament data
          const { data: tournamentData, error: tournamentError } = await supabase
            .from("tournaments")
            .select(`
              *,
              profiles:organizer_id (username, full_name),
              tournament_participants (
                user_id,
                profiles (username, full_name)
              )
            `)
            .eq("id", tournamentId)
            .single()

          if (tournamentError) {
            setError("Tournament not found")
            return
          }

          // Check if user has access (organizer or admin)
          if (tournamentData.organizer_id !== currentUser.id && !userIsAdmin) {
            console.log("[v0] User does not have access to results management")
            router.push(`/tournaments/${tournamentId}`)
            return
          }

          setTournament(tournamentData)
        }
      } catch (error) {
        console.error("[v0] Error loading results data:", error)
        setError("Failed to load tournament data")
      } finally {
        setLoading(false)
      }
    }

    loadResultsData()
  }, [tournamentId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <ResultsManagement tournament={tournament} user={user} />
      </div>
    </div>
  )
}
