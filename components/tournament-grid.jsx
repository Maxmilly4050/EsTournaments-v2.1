import { Calendar, Users, Trophy, Play, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TournamentGrid({ tournaments }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-600"
      case "ongoing":
        return "bg-green-600"
      case "completed":
        return "bg-gray-600"
      default:
        return "bg-blue-600"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "TBD"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {tournaments.map((tournament) => (
        <div
          key={tournament.id}
          className="bg-slate-800/80 glass-effect rounded-xl hover:bg-slate-700/90 hover-lift transition-all duration-300 group border border-slate-700/50 hover:border-purple-500/50 relative"
        >
          <div className="relative overflow-hidden rounded-t-xl">
            <img
              src={`/abstract-geometric-shapes.png?height=200&width=400&query=${tournament.game} tournament`}
              alt={tournament.name}
              className="w-full h-32 md:h-48 object-cover"
            />
            <div className="absolute top-2 right-2 md:top-3 md:right-3">
              <span
                className={`text-xs text-white px-2 py-1 md:px-3 rounded-full font-medium ${getStatusColor(tournament.status)}`}
              >
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </span>
            </div>
            {(tournament.status === "ongoing" || tournament.status === "completed") && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Link href={`/tournaments/${tournament.id}/bracket`}>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base animate-glow hover-lift">
                    <Play className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    View Bracket
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="p-4 md:p-6">
            <Link href={`/tournaments/${tournament.id}`}>
              <h3 className="font-semibold text-white text-sm md:text-base mb-2 line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer">
                {tournament.name}
              </h3>
            </Link>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{tournament.description}</p>

            <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
              <div className="flex items-center text-xs md:text-sm text-gray-400">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {formatDate(tournament.start_date)}
              </div>
              <div className="flex items-center text-xs md:text-sm text-gray-400">
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {tournament.current_participants}/{tournament.max_participants} players
              </div>
              {tournament.prize_pool && (
                <div className="flex items-center text-xs md:text-sm text-gray-400">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  {tournament.prize_pool}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3 md:mb-4">
              {/* Desktop: Show buttons inline */}
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                <Link href={`/tournaments/${tournament.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent text-xs md:text-sm px-2 md:px-3"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                </Link>
                {(tournament.status === "ongoing" || tournament.status === "completed") && (
                  <Link href={`/tournaments/${tournament.id}/bracket`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm px-2 md:px-3 hover-lift" aria-label={`View bracket for ${tournament.name}`}>
                      <Play className="w-3 h-3 mr-1" />
                      Bracket
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile: Show dropdown for actions */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent px-2 touch-target"
                      aria-label="Tournament actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="bg-slate-700 border-slate-600 shadow-xl z-[60] min-w-[160px]"
                  >
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-slate-600">
                      <Link href={`/tournaments/${tournament.id}`} className="flex items-center w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {(tournament.status === "ongoing" || tournament.status === "completed") && (
                      <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-slate-600">
                        <Link href={`/tournaments/${tournament.id}/bracket`} className="flex items-center w-full">
                          <Play className="w-4 h-4 mr-2" />
                          View Bracket
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <span className="text-xs text-gray-400 font-medium">{tournament.game}</span>
            </div>

            <div className="pt-3 md:pt-4 border-t border-slate-700">
              <p className="text-xs text-gray-500">
                Created by {tournament.profiles?.username || tournament.profiles?.full_name || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
