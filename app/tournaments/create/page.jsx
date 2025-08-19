"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import CreateTournamentForm from "@/components/create-tournament-form"
import Header from "@/components/header"

export default function CreateTournamentPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("Auth error:", error)
          setAuthError(true)
          setLoading(false)
          return
        }

        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error("Error checking auth:", error)
        setAuthError(true)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading tournament creation...</p>
          </div>
        </div>
      </>
    )
  }

  if (authError || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">You need to be logged in to create a tournament.</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-900 pt-20 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Create Tournament</h1>
              <p className="text-gray-400 text-lg">Set up your gaming tournament and invite players to compete</p>
            </div>
            <CreateTournamentForm />
          </div>
        </div>
      </div>
    </>
  )
}
