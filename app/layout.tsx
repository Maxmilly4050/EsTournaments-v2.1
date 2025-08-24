import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

// Configure fonts with optimized loading
const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: "EsTournaments - Competitive Gaming Tournaments",
  description: "Join competitive gaming tournaments, win prizes and climb leaderboards",
  generator: "Next.js",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={geistSans.className}>{children}</body>
    </html>
  )
}
