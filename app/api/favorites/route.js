import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    favorites: [],
    message: "Favorites feature not implemented yet",
  })
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Favorites feature not implemented yet",
    },
    { status: 501 },
  )
}
