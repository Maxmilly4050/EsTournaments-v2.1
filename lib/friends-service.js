import { createClient } from "@/lib/supabase/client"

export class FriendsService {
  constructor() {
    this.supabase = createClient()
  }

  async getFriends(userId) {
    try {
      // Get accepted friends (both directions)
      const { data: friends, error } = await this.supabase
        .from("friends")
        .select("*")
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
        .eq("status", "accepted")

      if (error) throw error

      // Get profile data for all friend IDs
      const friendIds = friends?.map((f) => (f.follower_id === userId ? f.following_id : f.follower_id)) || []

      if (friendIds.length === 0) {
        return { success: true, data: [] }
      }

      const { data: profiles, error: profilesError } = await this.supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", friendIds)

      if (profilesError) throw profilesError

      // Format friends list
      const friendsList =
        friends?.map((friendship) => {
          const friendId = friendship.follower_id === userId ? friendship.following_id : friendship.follower_id
          const profile = profiles?.find((p) => p.id === friendId)

          return {
            id: friendship.id,
            friendshipId: friendship.id,
            userId: friendId,
            name: profile?.full_name || profile?.username || "Unknown User",
            username: profile?.username,
            avatar: profile?.avatar_url,
            since: friendship.created_at,
            status: friendship.status,
          }
        }) || []

      return { success: true, data: friendsList }
    } catch (error) {
      console.error("Error fetching friends:", error)
      return { success: false, error: error.message }
    }
  }

  async getPendingRequests(userId) {
    try {
      // Get pending friend requests sent to the user
      const { data: incoming, error: incomingError } = await this.supabase
        .from("friends")
        .select("*")
        .eq("following_id", userId)
        .eq("status", "pending")

      if (incomingError) throw incomingError

      // Get pending friend requests sent by the user
      const { data: outgoing, error: outgoingError } = await this.supabase
        .from("friends")
        .select("*")
        .eq("follower_id", userId)
        .eq("status", "pending")

      if (outgoingError) throw outgoingError

      // Get profile data for all user IDs
      const incomingUserIds = incoming?.map((r) => r.follower_id) || []
      const outgoingUserIds = outgoing?.map((r) => r.following_id) || []
      const allUserIds = [...incomingUserIds, ...outgoingUserIds]

      let profiles = []
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await this.supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", allUserIds)

        if (profilesError) throw profilesError
        profiles = profilesData || []
      }

      const incomingRequests =
        incoming?.map((request) => {
          const profile = profiles.find((p) => p.id === request.follower_id)
          return {
            id: request.id,
            userId: request.follower_id,
            name: profile?.full_name || profile?.username || "Unknown User",
            username: profile?.username,
            avatar: profile?.avatar_url,
            type: "incoming",
            createdAt: request.created_at,
          }
        }) || []

      const outgoingRequests =
        outgoing?.map((request) => {
          const profile = profiles.find((p) => p.id === request.following_id)
          return {
            id: request.id,
            userId: request.following_id,
            name: profile?.full_name || profile?.username || "Unknown User",
            username: profile?.username,
            avatar: profile?.avatar_url,
            type: "outgoing",
            createdAt: request.created_at,
          }
        }) || []

      return {
        success: true,
        data: {
          incoming: incomingRequests,
          outgoing: outgoingRequests,
        },
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
      return { success: false, error: error.message }
    }
  }

  async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Check if relationship already exists
      const { data: existing } = await this.supabase
        .from("friends")
        .select("*")
        .or(
          `and(follower_id.eq.${fromUserId},following_id.eq.${toUserId}),and(follower_id.eq.${toUserId},following_id.eq.${fromUserId})`,
        )
        .single()

      if (existing) {
        return { success: false, error: "Friend relationship already exists" }
      }

      const { data, error } = await this.supabase
        .from("friends")
        .insert({
          follower_id: fromUserId,
          following_id: toUserId,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error sending friend request:", error)
      return { success: false, error: error.message }
    }
  }

  async acceptFriendRequest(requestId) {
    try {
      const { data, error } = await this.supabase
        .from("friends")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error accepting friend request:", error)
      return { success: false, error: error.message }
    }
  }

  async declineFriendRequest(requestId) {
    try {
      const { error } = await this.supabase.from("friends").delete().eq("id", requestId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error declining friend request:", error)
      return { success: false, error: error.message }
    }
  }

  async removeFriend(friendshipId) {
    try {
      const { error } = await this.supabase.from("friends").delete().eq("id", friendshipId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error removing friend:", error)
      return { success: false, error: error.message }
    }
  }

  async searchUsers(query, currentUserId) {
    try {
      const { data: users, error } = await this.supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .neq("id", currentUserId)
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10)

      if (error) throw error

      // Check friendship status for each user
      const userIds = users?.map((u) => u.id) || []
      const { data: friendships } = await this.supabase
        .from("friends")
        .select("*")
        .or(
          userIds
            .map(
              (id) =>
                `and(follower_id.eq.${currentUserId},following_id.eq.${id}),and(follower_id.eq.${id},following_id.eq.${currentUserId})`,
            )
            .join(","),
        )

      const usersWithStatus =
        users?.map((user) => {
          const friendship = friendships?.find(
            (f) =>
              (f.follower_id === currentUserId && f.following_id === user.id) ||
              (f.follower_id === user.id && f.following_id === currentUserId),
          )

          let friendshipStatus = "none"
          if (friendship) {
            if (friendship.status === "accepted") {
              friendshipStatus = "friends"
            } else if (friendship.follower_id === currentUserId) {
              friendshipStatus = "pending_sent"
            } else {
              friendshipStatus = "pending_received"
            }
          }

          return {
            ...user,
            friendshipStatus,
            friendshipId: friendship?.id,
          }
        }) || []

      return { success: true, data: usersWithStatus }
    } catch (error) {
      console.error("Error searching users:", error)
      return { success: false, error: error.message }
    }
  }

  async getFriendActivity(userId) {
    try {
      // Get recent tournament activities of friends
      const { data: friends } = await this.getFriends(userId)
      if (!friends.success) return { success: false, error: "Failed to fetch friends" }

      const friendIds = friends.data.map((f) => f.userId)
      if (friendIds.length === 0) return { success: true, data: [] }

      // Get recent tournament participations of friends
      const { data: activities, error } = await this.supabase
        .from("tournament_participants")
        .select("*")
        .in("user_id", friendIds)
        .order("joined_at", { ascending: false })
        .limit(20)

      if (error) throw error

      // Get tournament and profile data separately
      const tournamentIds = activities?.map((a) => a.tournament_id) || []
      const userIds = activities?.map((a) => a.user_id) || []

      const [tournamentsResult, profilesResult] = await Promise.all([
        tournamentIds.length > 0
          ? this.supabase.from("tournaments").select("id, title, game, status").in("id", tournamentIds)
          : { data: [] },
        userIds.length > 0
          ? this.supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
          : { data: [] },
      ])

      const tournaments = tournamentsResult.data || []
      const profiles = profilesResult.data || []

      const formattedActivities =
        activities?.map((activity) => {
          const tournament = tournaments.find((t) => t.id === activity.tournament_id)
          const profile = profiles.find((p) => p.id === activity.user_id)

          return {
            id: activity.id,
            type: "tournament_joined",
            user: {
              id: profile?.id,
              name: profile?.full_name || profile?.username || "Unknown User",
              avatar: profile?.avatar_url,
            },
            tournament: {
              id: tournament?.id,
              title: tournament?.title || "Unknown Tournament",
              game: tournament?.game,
              status: tournament?.status,
            },
            timestamp: activity.joined_at,
          }
        }) || []

      return { success: true, data: formattedActivities }
    } catch (error) {
      console.error("Error fetching friend activity:", error)
      return { success: false, error: error.message }
    }
  }
}

export const friendsService = new FriendsService()
