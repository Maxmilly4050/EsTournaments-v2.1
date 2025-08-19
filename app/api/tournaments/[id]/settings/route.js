import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies()

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const { id } = params
    const settings = await request.json()

    console.log("[v0] Tournament settings update:", { id, settings })

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser()

    console.log("[v0] Current user:", user?.id)
    console.log("[v0] User error:", userError)

    if (userError || !user) {
      console.log("[v0] User authentication failed:", userError?.message || "No user found")
      return Response.json({ error: "Unauthorized - Please log in again" }, { status: 401 })
    }

    const { data: tournament, error: fetchError } = await supabaseAdmin
      .from("tournaments")
      .select("organizer_id")
      .eq("id", id)
      .single()

    console.log("[v0] Tournament fetch result:", { tournament, fetchError })

    if (fetchError || !tournament) {
      console.error("[v0] Tournament fetch error:", fetchError)
      return Response.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check if user is the tournament organizer
    if (tournament.organizer_id !== user.id) {
      console.log("[v0] Authorization failed: user", user.id, "is not organizer", tournament.organizer_id)
      return Response.json({ error: "Only tournament organizers can modify settings" }, { status: 403 })
    }

    console.log("[v0] Starting database update...")

    const updateData = {
      title: settings.title,
      description: settings.description,
      game: settings.game,
      tournament_type: settings.tournament_type,
      max_participants: Number.parseInt(settings.max_participants) || 8,
      entry_fee_amount: Number.parseFloat(settings.entry_fee) || 0,
      prize_pool: settings.prize_pool?.toString() || "0",
      start_date: settings.start_date,
      end_date: settings.end_date,
      registration_deadline: settings.registration_deadline,
      visibility: settings.is_public ? "public" : "private",
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Update data:", updateData)

    const { data: updatedTournament, error: updateError } = await supabaseAdmin
      .from("tournaments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    console.log("[v0] Database update result:", { updatedTournament, updateError })

    if (updateError) {
      console.error("[v0] Tournament update error:", updateError)
      return Response.json(
        {
          error: "Failed to update tournament settings",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Tournament settings updated successfully:", updatedTournament.id)

    return Response.json({
      success: true,
      tournament: updatedTournament,
    })
  } catch (error) {
    console.error("[v0] Tournament settings API error:", error)
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
