import { createClient } from "@/lib/supabase/server"

let notificationServiceInstance = null
const requestCache = new Map()
const CACHE_DURATION = 30000 // 30 seconds

export class NotificationService {
  constructor() {
    if (notificationServiceInstance) {
      return notificationServiceInstance
    }

    this.supabase = createClient()
    this.tableExistsCache = true
    this.lastTableCheck = null
    this.rateLimitedUntil = null

    notificationServiceInstance = this
  }

  async getCachedResult(cacheKey, fetchFunction, cacheDuration = CACHE_DURATION) {
    const now = Date.now()
    const cached = requestCache.get(cacheKey)

    if (cached && now - cached.timestamp < cacheDuration) {
      console.log("[v0] Using cached result for", cacheKey)
      return cached.data
    }

    try {
      const result = await fetchFunction()
      requestCache.set(cacheKey, { data: result, timestamp: now })
      return result
    } catch (error) {
      // If we have a cached result and get an error, return the cached result
      if (cached) {
        console.log("[v0] Error occurred, using stale cached result for", cacheKey)
        return cached.data
      }
      throw error
    }
  }

  async safeSupabaseQuery(queryFunction, fallbackResult = null) {
    try {
      const now = Date.now()
      if (this.rateLimitedUntil && now < this.rateLimitedUntil) {
        console.log("[v0] Still in rate limit cooldown, returning fallback")
        return fallbackResult
      }

      const result = await queryFunction()

      // Reset rate limit if successful
      this.rateLimitedUntil = null
      return result
    } catch (error) {
      console.log("[v0] Supabase query error:", error.message)

      // Check for rate limiting or JSON parsing errors
      if (
        error.message &&
        (error.message.includes("Too Many") ||
          error.message.includes("SyntaxError") ||
          error.message.includes("Unexpected token"))
      ) {
        console.log("[v0] Rate limited or JSON parsing error, setting cooldown")
        this.rateLimitedUntil = Date.now() + 300000 // 5 minute cooldown
        return fallbackResult
      }

      throw error
    }
  }

  async checkNotificationsTableExists() {
    const cacheKey = "table-exists-check"

    return this.getCachedResult(
      cacheKey,
      async () => {
        return this.safeSupabaseQuery(async () => {
          const { error } = await this.supabase.from("notifications").select("id").limit(1)

          if (!error) {
            return true
          } else if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
            return false
          }

          // For other errors, assume table exists
          return true
        }, true) // Default to true if we can't check
      },
      600000,
    ) // Cache for 10 minutes
  }

  async sendMatchReminders() {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping match reminders")
        return { sent: 0 }
      }

      const now = new Date()
      const reminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      const { data: upcomingMatches, error } = await this.supabase
        .from("matches")
        .select(`
          *,
          tournaments(title),
          player1:profiles!matches_player1_id_fkey(id, username),
          player2:profiles!matches_player2_id_fkey(id, username)
        `)
        .eq("status", "active")
        .lte("scheduled_at", reminderTime.toISOString())
        .is("reminder_sent", null)

      if (error) throw error

      for (const match of upcomingMatches) {
        const notifications = []

        if (match.player1_id) {
          notifications.push({
            user_id: match.player1_id,
            tournament_id: match.tournament_id,
            match_id: match.id,
            type: "match_reminder",
            title: "Match Starting Soon",
            message: `Your ${match.tournaments.title} match starts in 2 hours. Get ready!`,
            scheduled_for: now.toISOString(),
          })
        }

        if (match.player2_id) {
          notifications.push({
            user_id: match.player2_id,
            tournament_id: match.tournament_id,
            match_id: match.id,
            type: "match_reminder",
            title: "Match Starting Soon",
            message: `Your ${match.tournaments.title} match starts in 2 hours. Get ready!`,
            scheduled_for: now.toISOString(),
          })
        }

        if (notifications.length > 0) {
          await this.supabase.from("notifications").insert(notifications)

          await this.supabase.from("matches").update({ reminder_sent: now.toISOString() }).eq("id", match.id)
        }
      }

      return { sent: upcomingMatches.length * 2 }
    } catch (error) {
      console.error("Error sending match reminders:", error)
      return { sent: 0 }
    }
  }

  async sendDeadlineWarnings() {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping deadline warnings")
        return { sent: 0 }
      }

      const now = new Date()
      const warningTime = new Date(now.getTime() + 30 * 60 * 1000)

      const { data: urgentMatches, error } = await this.supabase
        .from("matches")
        .select(`
          *,
          tournaments(title),
          player1:profiles!matches_player1_id_fkey(id, username),
          player2:profiles!matches_player2_id_fkey(id, username)
        `)
        .eq("status", "active")
        .lte("deadline", warningTime.toISOString())
        .is("deadline_warning_sent", null)

      if (error) throw error

      for (const match of urgentMatches) {
        const notifications = []

        if (match.player1_id && !match.player1_submitted_at) {
          notifications.push({
            user_id: match.player1_id,
            tournament_id: match.tournament_id,
            match_id: match.id,
            type: "deadline_warning",
            title: "⚠️ Match Deadline Approaching",
            message: `Your ${match.tournaments.title} match deadline is in 30 minutes! Submit your result now to avoid forfeit.`,
            scheduled_for: now.toISOString(),
          })
        }

        if (match.player2_id && !match.player2_submitted_at) {
          notifications.push({
            user_id: match.player2_id,
            tournament_id: match.tournament_id,
            match_id: match.id,
            type: "deadline_warning",
            title: "⚠️ Match Deadline Approaching",
            message: `Your ${match.tournaments.title} match deadline is in 30 minutes! Submit your result now to avoid forfeit.`,
            scheduled_for: now.toISOString(),
          })
        }

        if (notifications.length > 0) {
          await this.supabase.from("notifications").insert(notifications)

          await this.supabase.from("matches").update({ deadline_warning_sent: now.toISOString() }).eq("id", match.id)
        }
      }

      return { sent: urgentMatches.length }
    } catch (error) {
      console.error("Error sending deadline warnings:", error)
      return { sent: 0 }
    }
  }

  async sendResultNotification(matchId, winnerId, loserId, type = "match_result") {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping result notification")
        return { success: true }
      }

      const { data: match, error } = await this.supabase
        .from("matches")
        .select(`
          *,
          tournaments(title),
          winner:profiles!matches_winner_id_fkey(username)
        `)
        .eq("id", matchId)
        .single()

      if (error) throw error

      const notifications = [
        {
          user_id: winnerId,
          tournament_id: match.tournament_id,
          match_id: matchId,
          type: "result_notification",
          title: "🏆 Match Victory!",
          message: `Congratulations! You won your ${match.tournaments.title} match and advance to the next round.`,
        },
        {
          user_id: loserId,
          tournament_id: match.tournament_id,
          match_id: matchId,
          type: "result_notification",
          title: "Match Result",
          message: `Your ${match.tournaments.title} match has concluded. Better luck next time!`,
        },
      ]

      await this.supabase.from("notifications").insert(notifications)
      return { success: true }
    } catch (error) {
      console.error("Error sending result notifications:", error)
      return { success: false }
    }
  }

  async sendAdminDecisionNotification(matchId, decision, affectedPlayerIds, adminNotes = "") {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping admin decision notification")
        return { success: true }
      }

      const { data: match, error } = await this.supabase
        .from("matches")
        .select(`
          *,
          tournaments(title)
        `)
        .eq("id", matchId)
        .single()

      if (error) throw error

      const notifications = affectedPlayerIds.map((playerId) => ({
        user_id: playerId,
        tournament_id: match.tournament_id,
        match_id: matchId,
        type: "admin_decision",
        title: "Admin Decision",
        message: `Tournament admin has made a decision on your ${match.tournaments.title} match. ${
          adminNotes ? `Note: ${adminNotes}` : ""
        }`,
      }))

      await this.supabase.from("notifications").insert(notifications)
      return { success: true }
    } catch (error) {
      console.error("Error sending admin decision notifications:", error)
      return { success: false }
    }
  }

  async sendTournamentNotification(tournamentId, userIds, type, title, message) {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping tournament notification")
        return { success: true }
      }

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        tournament_id: tournamentId,
        type,
        title,
        message,
      }))

      await this.supabase.from("notifications").insert(notifications)
      return { success: true }
    } catch (error) {
      console.error("Error sending tournament notifications:", error)
      return { success: false }
    }
  }

  async markAsRead(notificationIds, userId) {
    try {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, skipping mark as read")
        return { success: true }
      }

      const { error } = await this.supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds)
        .eq("user_id", userId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      return { success: false }
    }
  }

  async getUserNotifications(userId, limit = 20) {
    const cacheKey = `user-notifications-${userId}-${limit}`

    return this.getCachedResult(cacheKey, async () => {
      const tableExists = await this.checkNotificationsTableExists()
      if (!tableExists) {
        console.log("[v0] Notifications table not found, returning empty notifications")
        return []
      }

      const notifications = await this.safeSupabaseQuery(async () => {
        const { data, error } = await this.supabase
          .from("notifications")
          .select(`
            id,
            user_id,
            tournament_id,
            match_id,
            type,
            title,
            message,
            is_read,
            created_at,
            scheduled_for
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (error) throw error
        return data
      }, [])

      if (!notifications || notifications.length === 0) {
        return []
      }

      const tournamentIds = [...new Set(notifications.filter((n) => n.tournament_id).map((n) => n.tournament_id))]
      const matchIds = [...new Set(notifications.filter((n) => n.match_id).map((n) => n.match_id))]

      let tournamentsMap = new Map()
      let matchesMap = new Map()

      try {
        const results = await Promise.allSettled([
          tournamentIds.length > 0
            ? this.safeSupabaseQuery(async () => {
                const { data, error } = await this.supabase
                  .from("tournaments")
                  .select("id, title")
                  .in("id", tournamentIds)
                if (error) throw error
                return data
              }, [])
            : Promise.resolve([]),
          matchIds.length > 0
            ? this.safeSupabaseQuery(async () => {
                const { data, error } = await this.supabase
                  .from("matches")
                  .select("id, round, match_number")
                  .in("id", matchIds)
                if (error) throw error
                return data
              }, [])
            : Promise.resolve([]),
        ])

        if (results[0].status === "fulfilled") {
          tournamentsMap = new Map((results[0].value || []).map((t) => [t.id, t]))
        }
        if (results[1].status === "fulfilled") {
          matchesMap = new Map((results[1].value || []).map((m) => [m.id, m]))
        }
      } catch (error) {
        console.log("[v0] Error fetching related data, using notifications without enrichment")
      }

      const enrichedNotifications = notifications.map((notification) => {
        const enriched = { ...notification }

        if (notification.tournament_id && tournamentsMap.has(notification.tournament_id)) {
          enriched.tournaments = tournamentsMap.get(notification.tournament_id)
        }

        if (notification.match_id && matchesMap.has(notification.match_id)) {
          enriched.matches = matchesMap.get(notification.match_id)
        }

        return enriched
      })

      return enrichedNotifications
    })
  }
}
