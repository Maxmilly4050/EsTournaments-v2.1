import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    history: [],
    message: "History feature not implemented yet",
  })
}
