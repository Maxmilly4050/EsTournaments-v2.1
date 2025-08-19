"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, RefreshCw } from "lucide-react"

export default function TournamentLifecycleManager() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [status, setStatus] = useState(null)

  const runLifecycleManagement = async () => {
    setIsRunning(true)
    try {
      console.log("[v0] Running tournament lifecycle management...")

      const response = await fetch("/api/tournaments/lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLastResult(result.data)
        console.log("[v0] Lifecycle management completed:", result)
      } else {
        console.error("[v0] Lifecycle management failed:", result)
      }
    } catch (error) {
      console.error("[v0] Lifecycle management error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/tournaments/lifecycle")
      const result = await response.json()

      if (response.ok) {
        setStatus(result.summary)
      }
    } catch (error) {
      console.error("[v0] Status check error:", error)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tournament Lifecycle Manager
        </CardTitle>
        <CardDescription>Automatically manage tournament status transitions and cleanup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runLifecycleManagement} disabled={isRunning} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running..." : "Run Lifecycle Management"}
          </Button>

          <Button variant="outline" onClick={checkStatus} className="flex items-center gap-2 bg-transparent">
            <Clock className="h-4 w-4" />
            Check Status
          </Button>
        </div>

        {status && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Tournament Status</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <Badge variant="secondary">{status.total}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Upcoming:</span>
                  <Badge variant="default">{status.upcoming}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Ongoing:</span>
                  <Badge variant="default">{status.ongoing}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Finished:</span>
                  <Badge variant="secondary">{status.finished}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Maintenance Needed</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Need Status Update:</span>
                  <Badge variant={status.needs_status_update > 0 ? "destructive" : "secondary"}>
                    {status.needs_status_update}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Ready for Cleanup:</span>
                  <Badge variant={status.ready_for_cleanup > 0 ? "destructive" : "secondary"}>
                    {status.ready_for_cleanup}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {lastResult && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Last Run Results</h4>
            <div className="text-sm space-y-1">
              <div>Tournaments Updated: {lastResult.tournaments_updated}</div>
              <div>Tournaments Cleaned: {lastResult.tournaments_cleaned}</div>
              <div>Timestamp: {new Date(lastResult.timestamp).toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
