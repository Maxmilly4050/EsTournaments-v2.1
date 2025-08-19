"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const searchRef = useRef(null)

  const mockTournaments = [
    {
      id: 1,
      name: "eFootball 2026 Championship",
      game: "eFootball 2026",
      image: "/efootball-tournament.png",
      participants: "24/32 players",
      prize: "TZS 50,000",
    },
    {
      id: 2,
      name: "FC Mobile World Cup",
      game: "FC Mobile",
      image: "/fc-mobile-tournament.png",
      participants: "47/64 players",
      prize: "TZS 75,000",
    },
    {
      id: 3,
      name: "eFootball Pro League",
      game: "eFootball 2026",
      image: "/efootball-tournament.png",
      participants: "16/16 players",
      prize: "TZS 30,000",
    },
    {
      id: 4,
      name: "FC Mobile Champions League",
      game: "FC Mobile",
      image: "/fc-mobile-tournament.png",
      participants: "31/48 players",
      prize: "Free Entry",
    },
    {
      id: 5,
      name: "Ultimate eFootball Tournament",
      game: "eFootball 2026",
      image: "/efootball-tournament.png",
      participants: "8/16 players",
      prize: "TZS 100,000",
    },
  ]

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = mockTournaments
        .filter(
          (tournament) =>
            tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournament.game.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, 3) // Show only first 3 suggestions

      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/tournaments?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/tournaments")
    }
    setShowSuggestions(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  const handleSuggestionClick = (tournament) => {
    setSearchQuery(tournament.name)
    setShowSuggestions(false)
    router.push(`/tournaments?search=${encodeURIComponent(tournament.name)}`)
  }

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Compete in Epic
          <span className="text-blue-400 block">Gaming Tournaments</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of players in competitive tournaments across your favorite games. Win prizes, climb
          leaderboards, and prove your skills.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <div className="relative w-full sm:w-96" ref={searchRef}>
            <Input
              placeholder="Search tournaments..."
              className="w-full bg-slate-700 border-slate-600 text-white placeholder-gray-400 pr-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {suggestions.map((tournament) => (
                  <div
                    key={tournament.id}
                    onClick={() => handleSuggestionClick(tournament)}
                    className="flex items-center gap-3 p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {tournament.game === "eFootball 2026" ? "eF" : "FC"}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium text-sm truncate">{tournament.name}</div>
                      <div className="text-gray-400 text-xs">
                        {tournament.game} • {tournament.participants}
                      </div>
                    </div>
                    <div className="text-blue-400 text-xs font-medium">{tournament.prize}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/tournaments">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Browse Tournaments
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
