import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const formData = await request.formData()
    const file = formData.get("file")
    const matchId = formData.get("matchId")
    const playerId = formData.get("playerId")

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== playerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `match-${matchId}-player-${playerId}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("match-screenshots").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("match-screenshots").getPublicUrl(fileName)

    return NextResponse.json({ screenshotUrl: publicUrl })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
