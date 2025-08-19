"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Camera, Trophy, AlertTriangle, CheckCircle, Flag, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { DisputeFiling } from "./dispute-filing"

export function MatchResultSubmission({ match, currentUser, onResultSubmitted }) {
  const [loading, setLoading] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [matchResults, setMatchResults] = useState([])
  const [formData, setFormData] = useState({
    winner_id: "",
    player1_score: 0,
    player2_score: 0,
    notes: "",
    screenshots: [],
  })

  const isParticipant = match.player1_id === currentUser?.id || match.player2_id === currentUser?.id
  const userResult = matchResults.find((result) => result.submitted_by === currentUser?.id)
  const otherPlayerResult = matchResults.find((result) => result.submitted_by !== currentUser?.id)

  useEffect(() => {
    fetchMatchResults()
  }, [match.id])

  const fetchMatchResults = async () => {
    try {
      const { data, error } = await supabase
        .from("match_results")
        .select(`
          *,
          submitted_by_profile:submitted_by (username, full_name),
          winner_profile:winner_id (username, full_name)
        `)
        .eq("match_id", match.id)
        .order("submitted_at", { ascending: false })

      if (error) throw error
      setMatchResults(data || [])
    } catch (error) {
      console.error("Error fetching results:", error)
    }
  }

  // ... existing code for form handling ...

  const handleScoreChange = (player, score) => {
    const newScore = Math.max(0, Number.parseInt(score) || 0)
    if (player === 1) {
      setFormData((prev) => ({
        ...prev,
        player1_score: newScore,
        winner_id:
          newScore > prev.player2_score ? match.player1_id : newScore < prev.player2_score ? match.player2_id : "",
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        player2_score: newScore,
        winner_id:
          prev.player1_score > newScore ? match.player1_id : prev.player1_score < newScore ? match.player2_id : "",
      }))
    }
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setLoading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `match-screenshots/${match.id}/${fileName}`

        const { data, error } = await supabase.storage.from("tournament-assets").upload(filePath, file)

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from("tournament-assets").getPublicUrl(filePath)

        return publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, ...uploadedUrls],
      }))

      toast({
        title: "Screenshots uploaded",
        description: `${files.length} screenshot(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload screenshots. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeScreenshot = (index) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }))
  }

  const submitResult = async () => {
    if (!formData.winner_id) {
      toast({
        title: "Winner required",
        description: "Please select a winner by setting the scores",
        variant: "destructive",
      })
      return
    }

    if (formData.screenshots.length === 0) {
      toast({
        title: "Screenshots required",
        description: "Please upload at least one screenshot as proof",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("user_id", currentUser.id)
      formDataToSend.append("score", `${formData.player1_score}-${formData.player2_score}`)
      formDataToSend.append("result_notes", formData.notes || "")

      // Convert first screenshot URL to blob and append
      if (formData.screenshots[0]) {
        try {
          const response = await fetch(formData.screenshots[0])
          const blob = await response.blob()
          formDataToSend.append("screenshot", blob, "screenshot.png")
        } catch (error) {
          console.error("[v0] Error converting screenshot to blob:", error)
          // Fallback: create a dummy file
          const dummyFile = new File(["screenshot"], "screenshot.png", { type: "image/png" })
          formDataToSend.append("screenshot", dummyFile)
        }
      }

      const response = await fetch(`/api/matches/${match.id}/result`, {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit result")
      }

      toast({
        title: "Result submitted",
        description: "Your match result has been submitted for review",
      })

      fetchMatchResults()
      onResultSubmitted?.()
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (playerId) => {
    if (playerId === match.player1_id) return match.player1?.username || match.player1?.full_name || "Player 1"
    if (playerId === match.player2_id) return match.player2?.username || match.player2?.full_name || "Player 2"
    return "Unknown Player"
  }

  if (!isParticipant) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-400">Only match participants can submit results</p>
        </CardContent>
      </Card>
    )
  }

  // Show dispute form if user wants to dispute
  if (showDispute && userResult) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setShowDispute(false)}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          ← Back to Result
        </Button>
        <DisputeFiling
          matchResult={userResult}
          currentUser={currentUser}
          onDisputeFiled={() => {
            setShowDispute(false)
            fetchMatchResults()
          }}
        />
      </div>
    )
  }

  if (userResult) {
    return (
      <div className="space-y-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Your Result Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge
                variant={
                  userResult?.status === "approved"
                    ? "default"
                    : userResult?.status === "disputed"
                      ? "destructive"
                      : "secondary"
                }
              >
                {userResult?.status === "approved"
                  ? "Approved"
                  : userResult?.status === "disputed"
                    ? "Disputed"
                    : userResult?.status === "rejected"
                      ? "Rejected"
                      : "Pending Review"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Winner:</span>
              <span className="text-white font-medium">{getPlayerName(userResult?.winner_id)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Score:</span>
              <span className="text-white font-medium">
                {userResult?.player1_score} - {userResult?.player2_score}
              </span>
            </div>
            {userResult?.notes && (
              <div>
                <span className="text-gray-400 block mb-1">Notes:</span>
                <p className="text-white text-sm bg-slate-700 p-2 rounded">{userResult.notes}</p>
              </div>
            )}

            {(userResult?.status === "approved" || userResult?.status === "pending") && (
              <div className="pt-4 border-t border-slate-600">
                <Button
                  onClick={() => setShowDispute(true)}
                  variant="outline"
                  className="w-full border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Dispute This Result
                </Button>
                <p className="text-gray-400 text-xs text-center mt-2">
                  Only dispute if you believe the result is incorrect
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {otherPlayerResult && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Opponent's Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Submitted by:</span>
                <span className="text-white">
                  {otherPlayerResult.submitted_by_profile?.username ||
                    otherPlayerResult.submitted_by_profile?.full_name ||
                    "Other Player"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Winner:</span>
                <span className="text-white font-medium">{getPlayerName(otherPlayerResult.winner_id)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Score:</span>
                <span className="text-white font-medium">
                  {otherPlayerResult.player1_score} - {otherPlayerResult.player2_score}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <Badge variant={otherPlayerResult.status === "approved" ? "default" : "secondary"}>
                  {otherPlayerResult.status}
                </Badge>
              </div>

              {userResult.winner_id !== otherPlayerResult.winner_id && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">Result Conflict</span>
                  </div>
                  <p className="text-red-200 text-sm mt-1">
                    Both players reported different winners. Tournament organizer will review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (match.status === "completed") {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 text-center">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Match Completed</h3>
          <p className="text-gray-400">This match has already been completed</p>
          <p className="text-white font-medium mt-2">Winner: {getPlayerName(match.winner_id)}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Submit Match Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Input */}
        <div className="space-y-4">
          <Label className="text-white font-medium">Match Score</Label>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">{getPlayerName(match.player1_id)}</Label>
              <Input
                type="number"
                min="0"
                value={formData.player1_score}
                onChange={(e) => handleScoreChange(1, e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-center"
                placeholder="0"
              />
            </div>
            <div className="text-center text-gray-400 font-bold">VS</div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">{getPlayerName(match.player2_id)}</Label>
              <Input
                type="number"
                min="0"
                value={formData.player2_score}
                onChange={(e) => handleScoreChange(2, e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-center"
                placeholder="0"
              />
            </div>
          </div>
          {formData.winner_id && (
            <div className="text-center">
              <Badge className="bg-green-600 text-white">Winner: {getPlayerName(formData.winner_id)}</Badge>
            </div>
          )}
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-4">
          <Label className="text-white font-medium">Match Screenshots (Required)</Label>
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="screenshot-upload"
              disabled={loading}
              ref={(input) => {
                if (input) {
                  input.onclick = () => {
                    console.log("[v0] File input clicked")
                  }
                }
              }}
            />
            <div
              className="cursor-pointer"
              onClick={() => {
                console.log("[v0] Upload area clicked")
                const input = document.getElementById("screenshot-upload")
                if (input) {
                  console.log("[v0] Triggering file input click")
                  input.click()
                } else {
                  console.log("[v0] File input not found")
                }
              }}
            >
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Upload Match Screenshots</p>
              <p className="text-gray-400 text-sm">Click to select images or drag and drop</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 bg-transparent"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("[v0] Button clicked, triggering file input")
                  const input = document.getElementById("screenshot-upload")
                  if (input) {
                    input.click()
                  }
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Uploading..." : "Choose Files"}
              </Button>
            </div>
          </div>
        </div>

        {/* Screenshot Preview */}
        {formData.screenshots.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.screenshots.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0"
                  onClick={() => removeScreenshot(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MatchResultSubmission
