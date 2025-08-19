import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verificationService } from "@/lib/verification-service"

export async function GET() {
  try {
    // Get authenticated user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get verification status
    const result = await verificationService.getVerificationStatus(user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error getting verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
