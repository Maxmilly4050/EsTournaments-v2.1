"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import Leaderboard from "@/components/leaderboard"
import { createClient } from "@/lib/supabase/client"

export default function LeaderboardPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setCurrentUser(session?.user || null)
      } catch (error) {
        console.error('Error getting user session:', error)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 80px)" }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <Leaderboard currentUser={currentUser} />
    </div>
  )
}
