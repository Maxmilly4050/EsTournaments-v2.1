import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentId = params.id

    // Get payment status
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("player_id", user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: payment.status,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      provider: payment.provider,
    })
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
