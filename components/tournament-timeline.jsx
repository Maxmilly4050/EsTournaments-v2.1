"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Clock,
    Trophy,
    Users,
    Play,
    CheckCircle,
    AlertTriangle,
    Flag,
    Upload,
    Award,
    Calendar,
    Target,
} from "lucide-react"

export function TournamentTimeline({ tournament, matches = [], logs = [] }) {
    const [timelineEvents, setTimelineEvents] = useState([])

    useEffect(() => {
        generateTimeline()
    }, [tournament, matches, logs])

    const generateTimeline = () => {
        const events = []

        // Tournament creation
        events.push({
            id: `tournament-created-${tournament.id}`,
            type: "tournament_created",
            title: "Tournament Created",
            description: `${tournament.title} was created`,
            timestamp: tournament.created_at,
            icon: Trophy,
            color: "blue",
        })

        // Registration period
        if (tournament.registration_deadline) {
            events.push({
                id: `registration-deadline-${tournament.id}`,
                type: "registration_deadline",
                title: "Registration Deadline",
                description: "Last chance to join the tournament",
                timestamp: tournament.registration_deadline,
                icon: Users,
                color: "yellow",
            })
        }

        // Tournament start
        if (tournament.start_date) {
            events.push({
                id: `tournament-start-${tournament.id}`,
                type: "tournament_start",
                title: "Tournament Begins",
                description: "Tournament officially starts",
                timestamp: tournament.start_date,
                icon: Play,
                color: "green",
            })
        }

        // Match events
        matches.forEach((match) => {
            // Match scheduled
            if (match.scheduled_at) {
                events.push({
                    id: `match-scheduled-${match.id}`,
                    type: "match_scheduled",
                    title: `Round ${match.round} - Match ${match.match_number}`,
                    description: `Match scheduled between players`,
                    timestamp: match.scheduled_at,
                    icon: Calendar,
                    color: "purple",
                    matchId: match.id,
                })
            }

            // Match deadline
            if (match.deadline) {
                events.push({
                    id: `match-deadline-${match.id}`,
                    type: "match_deadline",
                    title: `Match ${match.match_number} Deadline`,
                    description: `Deadline for Round ${match.round} submissions`,
                    timestamp: match.deadline,
                    icon: Clock,
                    color: "orange",
                    matchId: match.id,
                })
            }

            // Match completed
            if (match.completed_at) {
                events.push({
                    id: `match-completed-${match.id}`,
                    type: "match_completed",
                    title: `Match ${match.match_number} Completed`,
                    description: `Round ${match.round} match finished`,
                    timestamp: match.completed_at,
                    icon: CheckCircle,
                    color: "green",
                    matchId: match.id,
                })
            }
        })

        // Tournament logs
        logs.forEach((log) => {
            let icon = Flag
            let color = "gray"

            switch (log.action_type) {
                case "result_submitted":
                    icon = Upload
                    color = "blue"
                    break
                case "auto_advance":
                    icon = Target
                    color = "green"
                    break
                case "auto_forfeit":
                    icon = AlertTriangle
                    color = "red"
                    break
                case "admin_decision":
                    icon = Flag
                    color = "purple"
                    break
                case "tournament_complete":
                    icon = Award
                    color = "gold"
                    break
            }

            events.push({
                id: `log-${log.id}`,
                type: log.action_type,
                title: log.action_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                description: log.description,
                timestamp: log.created_at,
                icon,
                color,
                matchId: log.match_id,
            })
        })

        // Tournament end - Display actual end date if available, otherwise show as scheduled
        if (tournament.end_date) {
            const now = new Date()
            const endDate = new Date(tournament.end_date)
            const isCompleted = endDate <= now

            events.push({
                id: `tournament-end-${tournament.id}`,
                type: "tournament_end",
                title: isCompleted ? "Tournament Completed" : "Tournament Ends",
                description: isCompleted
                    ? "Tournament has concluded"
                    : "Tournament is scheduled to end",
                timestamp: tournament.end_date,
                icon: Award,
                color: isCompleted ? "gold" : "blue",
            })
        }

        // Sort events by timestamp
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        setTimelineEvents(events)
    }

    const getEventColor = (color) => {
        const colors = {
            blue: "border-blue-500 bg-blue-500/10 text-blue-400",
            green: "border-green-500 bg-green-500/10 text-green-400",
            yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
            orange: "border-orange-500 bg-orange-500/10 text-orange-400",
            red: "border-red-500 bg-red-500/10 text-red-400",
            purple: "border-purple-500 bg-purple-500/10 text-purple-400",
            gold: "border-yellow-400 bg-yellow-400/10 text-yellow-300",
            gray: "border-gray-500 bg-gray-500/10 text-gray-400",
        }
        return colors[color] || colors.gray
    }

    const getEventStatus = (event) => {
        const now = new Date()
        const eventTime = new Date(event.timestamp)

        if (eventTime <= now) {
            return "completed"
        } else if (eventTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
            return "upcoming"
        } else {
            return "future"
        }
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (date - now) / (1000 * 60 * 60)

        if (Math.abs(diffInHours) < 24) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        } else {
            return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        }
    }

    const getRelativeTime = (timestamp) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInMinutes = Math.floor((time - now) / (1000 * 60))

        if (diffInMinutes < 0) {
            const absDiff = Math.abs(diffInMinutes)
            if (absDiff < 60) return `${absDiff}m ago`
            if (absDiff < 1440) return `${Math.floor(absDiff / 60)}h ago`
            return `${Math.floor(absDiff / 1440)}d ago`
        } else {
            if (diffInMinutes < 60) return `in ${diffInMinutes}m`
            if (diffInMinutes < 1440) return `in ${Math.floor(diffInMinutes / 60)}h`
            return `in ${Math.floor(diffInMinutes / 1440)}d`
        }
    }

    return (
        <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Tournament Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {timelineEvents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No timeline events yet</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-600"></div>

                            {timelineEvents.map((event, index) => {
                                const Icon = event.icon
                                const status = getEventStatus(event)

                                return (
                                    <div key={event.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                                        {/* Timeline dot */}
                                        <div
                                            className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEventColor(
                                                event.color,
                                            )} ${status === "completed" ? "opacity-100" : status === "upcoming" ? "opacity-80" : "opacity-50"}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        {/* Event content */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className={`font-medium ${status === "completed" ? "text-white" : "text-slate-300"}`}>
                                                        {event.title}
                                                    </h4>
                                                    <p className={`text-sm mt-1 ${status === "completed" ? "text-slate-300" : "text-slate-400"}`}>
                                                        {event.description}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 ml-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${
                                                            status === "completed"
                                                                ? "border-green-500 text-green-400"
                                                                : status === "upcoming"
                                                                    ? "border-yellow-500 text-yellow-400"
                                                                    : "border-slate-500 text-slate-400"
                                                        }`}
                                                    >
                                                        {status === "completed" ? "Done" : status === "upcoming" ? "Soon" : "Scheduled"}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">{formatTimestamp(event.timestamp)}</span>
                                                    <span className="text-xs text-slate-600">{getRelativeTime(event.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Tournament Summary */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-slate-400">Start Date</div>
                            <div className="text-white font-medium">
                                {tournament.start_date
                                    ? new Date(tournament.start_date).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : "TBD"
                                }
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-slate-400">End Date</div>
                            <div className="text-white font-medium">
                                {tournament.end_date
                                    ? new Date(tournament.end_date).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : "TBD"
                                }
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-slate-400">Duration</div>
                            <div className="text-white font-medium">
                                {tournament.start_date && tournament.end_date
                                    ? (() => {
                                        const start = new Date(tournament.start_date)
                                        const end = new Date(tournament.end_date)
                                        const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
                                        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
                                    })()
                                    : "TBD"
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline legend */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-green-500 bg-green-500/10 rounded-full"></div>
                            <span className="text-slate-400">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-yellow-500 bg-yellow-500/10 rounded-full"></div>
                            <span className="text-slate-400">Upcoming (24h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-slate-500 bg-slate-500/10 rounded-full"></div>
                            <span className="text-slate-400">Future</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
