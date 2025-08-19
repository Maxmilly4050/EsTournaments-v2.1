import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request, { params }) {
  try {
    console.log("[v0] Match code API - Setting code for match:", params.id)

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get current user for authentication
    const authSupabase = createServerClient(
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
    } = await authSupabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Match code API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Valid match code is required" }, { status: 400 })
    }

    const matchId = Number.parseInt(params.id)
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    // Check if user is a participant in this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, player1_id, player2_id, match_code, code_set_by")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.log("[v0] Match code API - Match not found:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is a participant
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    // Check if code is already set
    if (match.match_code && match.code_set_by) {
      return NextResponse.json(
        {
          error: "Match code already set",
          code: match.match_code,
          set_by: match.code_set_by,
        },
        { status: 409 },
      )
    }

    // Set the match code
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        match_code: code.trim().toUpperCase(),
        code_set_by: user.id,
        code_set_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single()

    if (updateError) {
      console.log("[v0] Match code API - Update failed:", updateError)
      return NextResponse.json({ error: "Failed to set match code" }, { status: 500 })
    }

    console.log("[v0] Match code API - Code set successfully:", updatedMatch.match_code)
    return NextResponse.json({
      success: true,
      code: updatedMatch.match_code,
      set_by: user.id,
    })
  } catch (error) {
    console.error("[v0] Match code API - Error:", error)
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

    // Get match code if user is a participant
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("match_code, code_set_by, code_set_at, player1_id, player2_id")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is a participant
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    return NextResponse.json({
      code: match.match_code,
      set_by: match.code_set_by,
      set_at: match.code_set_at,
      can_set_code: !match.match_code && !match.code_set_by,
    })
  } catch (error) {
    console.error("[v0] Match code GET API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
