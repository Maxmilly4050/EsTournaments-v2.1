import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    console.log("[v0] Avatar upload API called")

    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Avatar upload - authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Avatar upload - user authenticated:", user.id)

    const formData = await request.formData()
    const file = formData.get("avatar")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Avatar upload - file received:", file.name, file.size, file.type)

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPG, PNG, and GIF files are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 2MB.",
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    console.log("[v0] Avatar upload - uploading to storage:", filePath)

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Upload to Supabase Storage using service role client
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Avatar upload - storage error:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload image",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Avatar upload - storage success:", uploadData)

    // Get public URL using service role client
    const {
      data: { publicUrl },
    } = serviceSupabase.storage.from("avatars").getPublicUrl(filePath)

    console.log("[v0] Avatar upload - public URL:", publicUrl)

    // Update user profile using service role client
    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Avatar upload - profile update error:", updateError)
      // Try to delete the uploaded file if profile update fails
      await serviceSupabase.storage.from("avatars").remove([filePath])
      return NextResponse.json(
        {
          error: "Failed to update profile",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Avatar upload - profile updated successfully")

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
    })
  } catch (error) {
    console.error("[v0] Avatar upload - unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
