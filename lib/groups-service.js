import { createClient } from "@/lib/supabase/client"

export class GroupsService {
  constructor() {
    this.supabase = createClient()
  }

  async getUserGroups(userId) {
    try {
      // First get user memberships
      const { data: memberships, error: membershipError } = await this.supabase
        .from("group_members")
        .select("*")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })

      if (membershipError) throw membershipError

      if (!memberships || memberships.length === 0) {
        return { success: true, data: [] }
      }

      // Then get group details separately
      const groupIds = memberships.map((m) => m.group_id)
      const { data: groups, error: groupsError } = await this.supabase
        .from("groups")
        .select(`
          id,
          name,
          description,
          avatar_url,
          is_private,
          max_members,
          current_members,
          owner_id,
          created_at
        `)
        .in("id", groupIds)

      if (groupsError) throw groupsError

      // Combine the data
      const groupsMap = new Map(groups?.map((g) => [g.id, g]) || [])
      const userGroups = memberships
        .map((membership) => {
          const group = groupsMap.get(membership.group_id)
          return {
            ...group,
            userRole: membership.role,
            joinedAt: membership.joined_at,
            membershipId: membership.id,
          }
        })
        .filter((group) => group.id) // Filter out any groups that weren't found

      return { success: true, data: userGroups }
    } catch (error) {
      console.error("Error fetching user groups:", error)
      return { success: false, error: error.message }
    }
  }

  async getPublicGroups(userId, limit = 20) {
    try {
      const { data: groups, error } = await this.supabase
        .from("groups")
        .select(`
          id,
          name,
          description,
          avatar_url,
          is_private,
          max_members,
          current_members,
          owner_id,
          created_at,
          updated_at
        `)
        .eq("is_private", false)
        .order("current_members", { ascending: false })
        .limit(limit)

      if (error) throw error

      const groupsWithDefaults =
        groups?.map((group) => ({
          ...group,
          isMember: false, // Default to false, will be updated by component if needed
          memberCount: group.current_members,
        })) || []

      return { success: true, data: groupsWithDefaults }
    } catch (error) {
      console.error("Error fetching public groups:", error)
      return { success: false, error: error.message }
    }
  }

  async createGroup(groupData, ownerId) {
    try {
      const { data: group, error } = await this.supabase
        .from("groups")
        .insert({
          name: groupData.name,
          description: groupData.description,
          is_private: groupData.isPrivate || false,
          max_members: groupData.maxMembers || 50,
          owner_id: ownerId,
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data: group }
    } catch (error) {
      console.error("Error creating group:", error)
      return { success: false, error: error.message }
    }
  }

  async joinGroup(groupId, userId) {
    try {
      // Check if group exists and has space
      const { data: group, error: groupError } = await this.supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single()

      if (groupError) throw groupError

      if (group.current_members >= group.max_members) {
        return { success: false, error: "Group is full" }
      }

      // Check if user is already a member
      const { data: existingMembership } = await this.supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single()

      if (existingMembership) {
        return { success: false, error: "Already a member of this group" }
      }

      // Add user to group
      const { data: membership, error } = await this.supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
          role: "member",
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data: membership }
    } catch (error) {
      console.error("Error joining group:", error)
      return { success: false, error: error.message }
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      // Check if user is the owner
      const { data: group } = await this.supabase.from("groups").select("owner_id").eq("id", groupId).single()

      if (group?.owner_id === userId) {
        return { success: false, error: "Group owners cannot leave their own group" }
      }

      const { error } = await this.supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error leaving group:", error)
      return { success: false, error: error.message }
    }
  }

  async getGroupMembers(groupId) {
    try {
      const { data: members, error } = await this.supabase
        .from("group_members")
        .select(`
          *,
          profiles (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true })

      if (error) throw error

      const formattedMembers =
        members?.map((member) => ({
          id: member.id,
          userId: member.profiles.id,
          name: member.profiles.full_name || member.profiles.username || "Unknown User",
          username: member.profiles.username,
          avatar: member.profiles.avatar_url,
          role: member.role,
          joinedAt: member.joined_at,
        })) || []

      return { success: true, data: formattedMembers }
    } catch (error) {
      console.error("Error fetching group members:", error)
      return { success: false, error: error.message }
    }
  }

  async updateGroupRole(groupId, userId, newRole, requesterId) {
    try {
      // Check if requester has permission (owner or admin)
      const { data: requesterMembership } = await this.supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", requesterId)
        .single()

      if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
        return { success: false, error: "Insufficient permissions" }
      }

      const { data, error } = await this.supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error updating group role:", error)
      return { success: false, error: error.message }
    }
  }

  async removeMember(groupId, userId, requesterId) {
    try {
      // Check if requester has permission
      const { data: requesterMembership } = await this.supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", requesterId)
        .single()

      if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
        return { success: false, error: "Insufficient permissions" }
      }

      // Cannot remove the owner
      const { data: targetMembership } = await this.supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single()

      if (targetMembership?.role === "owner") {
        return { success: false, error: "Cannot remove group owner" }
      }

      const { error } = await this.supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error removing member:", error)
      return { success: false, error: error.message }
    }
  }

  async searchGroups(query, userId) {
    try {
      const { data: groups, error } = await this.supabase
        .from("groups")
        .select("*")
        .eq("is_private", false)
        .ilike("name", `%${query}%`)
        .limit(10)

      if (error) throw error

      // Check membership status for each group
      const { data: userMemberships } = await this.supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)

      const userGroupIds = new Set(userMemberships?.map((m) => m.group_id) || [])

      const groupsWithStatus =
        groups?.map((group) => ({
          ...group,
          isMember: userGroupIds.has(group.id),
        })) || []

      return { success: true, data: groupsWithStatus }
    } catch (error) {
      console.error("Error searching groups:", error)
      return { success: false, error: error.message }
    }
  }

  async deleteGroup(groupId, userId) {
    try {
      // Check if user is the owner
      const { data: group } = await this.supabase
        .from("groups")
        .select("owner_id")
        .eq("id", groupId)
        .eq("owner_id", userId)
        .single()

      if (!group) {
        return { success: false, error: "Only group owners can delete groups" }
      }

      const { error } = await this.supabase.from("groups").delete().eq("id", groupId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error deleting group:", error)
      return { success: false, error: error.message }
    }
  }
}

export const groupsService = new GroupsService()
