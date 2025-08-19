import { NextResponse } from "next/server"
import { NotificationService } from "@/lib/notification-service"

export async function POST(request) {
  try {
    // This endpoint can be called by cron job or admin
    const notificationService = new NotificationService()

    const reminders = await notificationService.sendMatchReminders()
    const warnings = await notificationService.sendDeadlineWarnings()

    return NextResponse.json({
      reminders: reminders.sent,
      warnings: warnings.sent,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
