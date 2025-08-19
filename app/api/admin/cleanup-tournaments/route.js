import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(request) {
  try {
    // Call the manual cleanup function
    const { data, error } = await supabase.rpc("manual_tournament_cleanup")

    if (error) {
      console.error("Tournament cleanup error:", error)
      return Response.json({ error: "Failed to cleanup tournaments" }, { status: 500 })
    }

    const result = data[0] || { deleted_tournaments: 0, deleted_participants: 0, deleted_matches: 0 }

    return Response.json({
      success: true,
      message: "Tournament cleanup completed",
      deleted: {
        tournaments: result.deleted_tournaments,
        participants: result.deleted_participants,
        matches: result.deleted_matches,
      },
    })
  } catch (error) {
    console.error("Tournament cleanup error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Check how many tournaments would be deleted
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, title, end_date")
      .not("end_date", "is", null)
      .lt("end_date", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error("Tournament check error:", error)
      return Response.json({ error: "Failed to check tournaments" }, { status: 500 })
    }

    return Response.json({
      tournaments_to_delete: data.length,
      tournaments: data,
    })
  } catch (error) {
    console.error("Tournament check error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
