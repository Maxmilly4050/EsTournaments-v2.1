"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, Plus, User, LogOut, Shield, Trophy, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { signOut } from "@/lib/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useTransition, useEffect, useState, useRef } from "react"
import NotificationCenter from "./notifications"
import { createPortal } from "react-dom"

const ADMIN_USER_IDS = process.env.NEXT_PUBLIC_ADMIN_USER_IDS
  ? process.env.NEXT_PUBLIC_ADMIN_USER_IDS.split(",").map((id) => id.trim())
  : []

const SignOutButton = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = async () => {
    startTransition(async () => {
      const result = await signOut()
      if (result.success && result.redirect) {
        router.push(result.redirect)
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="flex items-center w-full text-gray-300 hover:text-white"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  )
}

export function Header() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const mockTournaments = [
    {
      id: 1,
      name: "eFootball 2026 Championship",
      game: "eFootball 2026",
      participants: "24/32 players",
      prize: "TZS 50,000",
    },
    {
      id: 2,
      name: "FC Mobile World Cup",
      game: "FC Mobile",
      participants: "47/64 players",
      prize: "TZS 75,000",
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
        .slice(0, 3)

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

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Simple admin check
          const adminCheck =
            ADMIN_USER_IDS.includes(session.user.id) ||
            session.user.email?.endsWith("@admin.com")
          setIsAdmin(adminCheck)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Auth error:", error)
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const adminCheck =
          ADMIN_USER_IDS.includes(currentUser.id) ||
          currentUser.email?.endsWith("@admin.com")
        setIsAdmin(adminCheck)
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])


  if (!mounted || loading) {
    return (
      <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold text-white">EsTournaments</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-9 bg-slate-700 rounded animate-pulse"></div>
              <div className="w-16 h-9 bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-white">EsTournaments</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/tournaments" className="text-gray-300 hover:text-white transition-colors">
                Tournaments
              </Link>
              <Link href="/games" className="text-gray-300 hover:text-white transition-colors">
                Games
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block" ref={searchRef}>
              <Input
                placeholder="Search tournaments..."
                className="w-64 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((tournament) => (
                    <div
                      key={tournament.id}
                      onClick={() => handleSuggestionClick(tournament)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
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

            {user ? (
              <div className="flex items-center space-x-2">
                <Link href="/tournaments/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tournament
                  </Button>
                </Link>

                {isAdmin && (
                  <Link href="/admin">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}

                <NotificationCenter user={user} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    className="bg-slate-700 border-slate-600 shadow-xl z-[60] min-w-[180px]"
                  >
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-slate-600">
                      <Link href="/profile" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-slate-600">
                      <Link href="/my-tournaments" className="flex items-center">
                        <Trophy className="w-4 h-4 mr-2" />
                        My Tournaments
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <DropdownMenuItem asChild className="text-red-300 hover:text-red-200 hover:bg-slate-600">
                        <Link href="/admin" className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-slate-600" />
                    <DropdownMenuItem asChild>
                      <SignOutButton />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign up</Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-blue-50 border-l border-blue-200 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-blue-200">
              <span className="text-gray-800 font-semibold text-lg">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-800 touch-target"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6">
              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <Input
                    placeholder="Search tournaments..."
                    className="w-full bg-white border-blue-300 text-gray-800 placeholder-gray-500 pr-12 h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-target"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="mb-6">
                <div className="space-y-1">
                  <Link
                    href="/tournaments"
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Trophy className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="font-medium">Tournaments</span>
                  </Link>
                  <Link
                    href="/games"
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="w-5 h-5 mr-3 flex items-center justify-center text-blue-600 font-bold text-sm">G</span>
                    <span className="font-medium">Games</span>
                  </Link>
                </div>
              </nav>

              {/* Mobile User Actions */}
              {user ? (
                <div className="border-t border-blue-200 pt-6">
                  <div className="space-y-3">
                    <Link
                      href="/tournaments/create"
                      className="block w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start h-12 text-base">
                        <Plus className="w-5 h-5 mr-3" />
                        Create Tournament
                      </Button>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white justify-start h-12 text-base">
                          <Shield className="w-5 h-5 mr-3" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}

                    <div className="space-y-1 pt-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3 text-blue-600" />
                        <span className="font-medium">Profile</span>
                      </Link>

                      <Link
                        href="/my-tournaments"
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Trophy className="w-5 h-5 mr-3 text-blue-600" />
                        <span className="font-medium">My Tournaments</span>
                      </Link>
                    </div>

                    <div className="border-t border-blue-200 pt-3 mt-3">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          handleSignOut()
                        }}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-target"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-blue-200 pt-6">
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      className="block w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 h-12 text-base">
                        Log in
                      </Button>
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="block w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
        )
      )}
    </header>
  )
}

export default Header
