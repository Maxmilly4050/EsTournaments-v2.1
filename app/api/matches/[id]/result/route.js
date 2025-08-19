import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request, { params }) {
  try {
    console.log("[v0] Match result API - Submitting result for match:", params.id)

    const cookieStore = cookies()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const formData = await request.formData()
    const userId = formData.get("user_id")
    const screenshot = formData.get("screenshot")
    const score = formData.get("score")
    const resultNotes = formData.get("result_notes")

    if (!userId) {
      console.log("[v0] Match result API - User ID missing")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (!screenshot) {
      return NextResponse.json({ error: "Screenshot is required" }, { status: 400 })
    }

    const matchId = Number.parseInt(params.id)
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    // Check if user is a participant in this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, player1_id, player2_id, tournament_id")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.log("[v0] Match result API - Match not found:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is a participant
    if (match.player1_id !== userId && match.player2_id !== userId) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    // Check if user has already submitted a result
    const { data: existingResult } = await supabase
      .from("match_results")
      .select("id")
      .eq("match_id", matchId)
      .eq("submitted_by", userId)
      .single()

    if (existingResult) {
      return NextResponse.json({ error: "Result already submitted for this match" }, { status: 409 })
    }

    // Upload screenshot to storage
    const fileExt = screenshot.name.split(".").pop()
    const fileName = `${matchId}-${userId}-${Date.now()}.${fileExt}`
    const filePath = `match-results/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("match-results")
      .upload(filePath, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      })

    if (uploadError) {
      console.log("[v0] Match result API - Upload failed:", uploadError)
      return NextResponse.json({ error: "Failed to upload screenshot" }, { status: 500 })
    }

    // Get public URL for the uploaded screenshot
    const {
      data: { publicUrl },
    } = supabase.storage.from("match-results").getPublicUrl(filePath)

    // Save result to database
    const { data: result, error: resultError } = await supabase
      .from("match_results")
      .insert({
        match_id: matchId,
        submitted_by: userId,
        screenshot_url: publicUrl,
        score: score ? Number.parseInt(score) : null,
        result_notes: resultNotes || null,
      })
      .select()
      .single()

    if (resultError) {
      console.log("[v0] Match result API - Database insert failed:", resultError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("match-results").remove([filePath])
      return NextResponse.json({ error: "Failed to save result" }, { status: 500 })
    }

    console.log("[v0] Match result API - Result submitted successfully:", result.id)
    return NextResponse.json({
      success: true,
      result_id: result.id,
      screenshot_url: publicUrl,
    })
  } catch (error) {
    console.error("[v0] Match result API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const matchId = Number.parseInt(params.id)
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    // Get match results if user is a participant or tournament organizer
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        id, player1_id, player2_id, tournament_id,
        tournaments!inner(organizer_id)
      `)
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is authorized (participant or organizer)
    const isParticipant = match.player1_id === user.id || match.player2_id === user.id
    const isOrganizer = match.tournaments.organizer_id === user.id

    if (!isParticipant && !isOrganizer) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    // Get all results for this match
    const { data: results, error: resultsError } = await supabase
      .from("match_results")
      .select(`
        id, submitted_by, screenshot_url, score, result_notes, created_at,
        profiles!inner(display_name, gamer_tag)
      `)
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })

    if (resultsError) {
      console.log("[v0] Match results GET API - Error:", resultsError)
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
    }

    return NextResponse.json({ results: results || [] })
  } catch (error) {
    console.error("[v0] Match results GET API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
