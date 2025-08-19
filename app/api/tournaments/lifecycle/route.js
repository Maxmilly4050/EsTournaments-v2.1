import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    console.log("[v0] Running tournament lifecycle management...")

    // Call the database function to manage tournament lifecycle
    const { data, error } = await supabase.rpc("manage_tournament_lifecycle")

    if (error) {
      console.error("[v0] Tournament lifecycle error:", error)
      return Response.json({ error: "Failed to manage tournament lifecycle", details: error.message }, { status: 500 })
    }

    console.log("[v0] Tournament lifecycle management completed:", data)

    return Response.json({
      success: true,
      message: "Tournament lifecycle managed successfully",
      data,
    })
  } catch (error) {
    console.error("[v0] Tournament lifecycle management error:", error)
    return Response.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    // Get current tournament status summary
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select("status, start_date, end_date, updated_at")

    if (error) {
      return Response.json({ error: "Failed to fetch tournament status", details: error.message }, { status: 500 })
    }

    const now = new Date()
    const summary = {
      total: tournaments.length,
      upcoming: tournaments.filter((t) => t.status === "upcoming").length,
      ongoing: tournaments.filter((t) => t.status === "ongoing").length,
      finished: tournaments.filter((t) => t.status === "finished").length,
      needs_status_update: tournaments.filter(
        (t) =>
          (t.status === "upcoming" && new Date(t.start_date) <= now) ||
          (t.status === "ongoing" && new Date(t.end_date) <= now),
      ).length,
      ready_for_cleanup: tournaments.filter(
        (t) => t.status === "finished" && new Date(t.updated_at) <= new Date(now.getTime() - 24 * 60 * 60 * 1000),
      ).length,
    }

    return Response.json({
      success: true,
      summary,
      tournaments,
    })
  } catch (error) {
    console.error("[v0] Tournament status check error:", error)
    return Response.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
