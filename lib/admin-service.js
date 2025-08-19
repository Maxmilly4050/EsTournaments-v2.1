import { createClient } from "@/lib/supabase/client"

class AdminService {
  constructor() {
    this.supabase = createClient()
  }

  // Profile Management Methods
  async getUserProfiles(searchTerm = "", limit = 50) {
    try {
      let query = this.supabase
        .from("profiles")
        .select(`
          *,
          email_verifications(verified_at),
          phone_verifications(verified_at),
          profile_edit_history(count)
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,gamer_tag.ilike.%${searchTerm}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        data: data || [],
      }
    } catch (error) {
      console.error("Error fetching user profiles:", error)
      return {
        success: false,
        error: "Failed to fetch user profiles",
      }
    }
  }

  async getProfileEditHistory(userId) {
    try {
      const { data, error } = await this.supabase
        .from("profile_edit_history")
        .select(`
          *,
          edited_by_profile:edited_by(full_name, username)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || [],
      }
    } catch (error) {
      console.error("Error fetching edit history:", error)
      return {
        success: false,
        error: "Failed to fetch edit history",
      }
    }
  }

  async updateUserProfile(userId, updates, adminId, reason = "Admin override") {
    try {
      // Get current profile for logging
      const { data: currentProfile } = await this.supabase.from("profiles").select("*").eq("id", userId).single()

      if (!currentProfile) {
        throw new Error("User profile not found")
      }

      // Update profile
      const { error: updateError } = await this.supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) throw updateError

      // Log all changes
      const logPromises = Object.entries(updates).map(([field, newValue]) => {
        const oldValue = currentProfile[field]
        if (oldValue !== newValue) {
          return this.supabase.from("profile_edit_history").insert({
            user_id: userId,
            field_name: field,
            old_value: oldValue ? String(oldValue) : null,
            new_value: newValue ? String(newValue) : null,
            edited_by: adminId,
            edit_reason: reason,
          })
        }
        return Promise.resolve()
      })

      await Promise.all(logPromises)

      return {
        success: true,
        message: "Profile updated successfully",
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        error: error.message || "Failed to update profile",
      }
    }
  }

  async banUser(userId, reason, expiresAt, adminId) {
    try {
      const updates = {
        is_banned: true,
        ban_reason: reason,
        ban_expires_at: expiresAt,
      }

      return await this.updateUserProfile(userId, updates, adminId, `User banned: ${reason}`)
    } catch (error) {
      console.error("Error banning user:", error)
      return {
        success: false,
        error: "Failed to ban user",
      }
    }
  }

  async unbanUser(userId, adminId) {
    try {
      const updates = {
        is_banned: false,
        ban_reason: null,
        ban_expires_at: null,
      }

      return await this.updateUserProfile(userId, updates, adminId, "User unbanned by admin")
    } catch (error) {
      console.error("Error unbanning user:", error)
      return {
        success: false,
        error: "Failed to unban user",
      }
    }
  }

  async verifyUser(userId, adminId) {
    try {
      const updates = {
        is_verified: true,
        email_verified: true,
      }

      return await this.updateUserProfile(userId, updates, adminId, "User verified by admin")
    } catch (error) {
      console.error("Error verifying user:", error)
      return {
        success: false,
        error: "Failed to verify user",
      }
    }
  }

  async setTournamentHostPermission(userId, canHost, adminId) {
    try {
      const updates = {
        can_host_tournaments: canHost,
      }

      const reason = canHost ? "Tournament hosting permission granted" : "Tournament hosting permission revoked"
      return await this.updateUserProfile(userId, updates, adminId, reason)
    } catch (error) {
      console.error("Error updating tournament host permission:", error)
      return {
        success: false,
        error: "Failed to update tournament host permission",
      }
    }
  }

  async updateGameIds(userId, konamiUsername, eaId, adminId) {
    try {
      const updates = {}
      if (konamiUsername !== undefined) updates.konami_username = konamiUsername
      if (eaId !== undefined) updates.ea_id = eaId

      return await this.updateUserProfile(userId, updates, adminId, "Game IDs updated by admin")
    } catch (error) {
      console.error("Error updating game IDs:", error)
      return {
        success: false,
        error: "Failed to update game IDs",
      }
    }
  }

  async getPaymentHistory(userId) {
    try {
      const { data, error } = await this.supabase
        .from("payment_history")
        .select(`
          *,
          tournaments(title, game)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || [],
      }
    } catch (error) {
      console.error("Error fetching payment history:", error)
      return {
        success: false,
        error: "Failed to fetch payment history",
      }
    }
  }
}

export const adminService = new AdminService()
