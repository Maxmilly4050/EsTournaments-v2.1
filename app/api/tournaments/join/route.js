import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { withEmailVerification } from "@/lib/email-verification-middleware"

// Mock payment gateway integration - replace with actual Selcom/Flutterwave integration
async function initiatePayment({ amount, provider, phoneNumber, tournamentId, userId }) {
  // This would be replaced with actual payment gateway integration
  // For now, we'll simulate the payment process

  const mockTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Simulate payment gateway response
  const mockResponse = {
    success: true,
    transactionId: mockTransactionId,
    status: "pending",
    message: "Payment initiated successfully",
  }

  // In a real implementation, you would:
  // 1. Call Selcom/Flutterwave API to initiate payment
  // 2. Handle the response and return appropriate data
  // 3. Set up webhooks to receive payment confirmations

  return mockResponse
}

// Mock SMS service - replace with Africa's Talking or Twilio
async function sendSMSConfirmation(phoneNumber, tournamentTitle) {
  // This would be replaced with actual SMS service integration
  console.log(
    `Sending SMS to ${phoneNumber}: ✅ You've successfully joined ${tournamentTitle}! Good luck and play fair. ⚽ – E-Football Hub`,
  )

  // In a real implementation:
  // 1. Use Africa's Talking or Twilio API
  // 2. Send actual SMS
  // 3. Handle delivery status

  return { success: true, messageId: `SMS_${Date.now()}` }
}

async function joinTournamentHandler(request) {
  try {
    const supabase = createClient()
    const user = request.user // User is already verified by middleware

    const { tournamentId, provider, phoneNumber, amount } = await request.json()

    // Validate input
    if (!tournamentId || !provider || !phoneNumber || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if tournament exists and is open for registration
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("user_id", user.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: "Already registered for this tournament" }, { status: 400 })
    }

    // Check if tournament is full
    if (tournament.participant_count >= tournament.max_participants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Check registration deadline
    const registrationDeadline = new Date(tournament.registration_deadline)
    if (new Date() > registrationDeadline) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        player_id: user.id,
        tournament_id: tournamentId,
        amount: amount,
        provider: provider,
        phone_number: phoneNumber,
        status: "pending",
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment creation error:", paymentError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    // Initiate payment with gateway
    try {
      const paymentResult = await initiatePayment({
        amount,
        provider,
        phoneNumber,
        tournamentId,
        userId: user.id,
      })

      if (paymentResult.success) {
        // Update payment record with transaction ID
        await supabase
          .from("payments")
          .update({
            transaction_id: paymentResult.transactionId,
            gateway_response: paymentResult,
          })
          .eq("id", payment.id)

        // Simulate payment confirmation after 30 seconds (for demo purposes)
        setTimeout(async () => {
          try {
            // Update payment status to confirmed
            await supabase.from("payments").update({ status: "confirmed" }).eq("id", payment.id)

            // Add user to tournament participants
            await supabase.from("tournament_participants").insert({
              tournament_id: tournamentId,
              user_id: user.id,
            })

            // Update tournament participant count
            await supabase
              .from("tournaments")
              .update({
                participant_count: tournament.participant_count + 1,
              })
              .eq("id", tournamentId)

            // Send SMS confirmation
            await sendSMSConfirmation(phoneNumber, tournament.title)
          } catch (error) {
            console.error("Payment confirmation error:", error)
          }
        }, 30000) // 30 seconds delay for demo

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          transactionId: paymentResult.transactionId,
          message: "Payment initiated successfully",
        })
      } else {
        // Update payment status to failed
        await supabase
          .from("payments")
          .update({
            status: "failed",
            gateway_response: paymentResult,
          })
          .eq("id", payment.id)

        return NextResponse.json({ error: "Payment initiation failed" }, { status: 400 })
      }
    } catch (paymentError) {
      console.error("Payment gateway error:", paymentError)

      // Update payment status to failed
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id)

      return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 })
    }
  } catch (error) {
    console.error("Tournament join error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withEmailVerification(joinTournamentHandler)
