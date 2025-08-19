"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Camera,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Copy,
  X,
  User,
  GamepadIcon,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function MatchDetailsModal({ match, currentUser, onClose, onResultSubmitted }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("code")
  const [matchCode, setMatchCode] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [matchResults, setMatchResults] = useState([])
  const [formData, setFormData] = useState({
    score: "",
    resultNotes: "",
    screenshot: null,
  })

  const isParticipant = match.player1_id === currentUser?.id || match.player2_id === currentUser?.id
  const userResult = matchResults.find((result) => result.submitted_by === currentUser?.id)
  const otherPlayerResult = matchResults.find((result) => result.submitted_by !== currentUser?.id)

  useEffect(() => {
    if (match.id) {
      fetchMatchCode()
      fetchMatchResults()
    }
  }, [match.id])

  const fetchMatchCode = async () => {
    try {
      const response = await fetch(`/api/matches/${match.id}/code`)
      if (response.ok) {
        const data = await response.json()
        setMatchCode(data.code || "")
      }
    } catch (error) {
      console.error("[v0] Error fetching match code:", error)
    }
  }

  const fetchMatchResults = async () => {
    try {
      const response = await fetch(`/api/matches/${match.id}/result`)
      if (response.ok) {
        const data = await response.json()
        setMatchResults(data.results || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching match results:", error)
    }
  }

  const handleSetMatchCode = async () => {
    if (!codeInput.trim()) {
      toast({
        title: "Code required",
        description: "Please enter a match code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/matches/${match.id}/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setMatchCode(data.code)
        setCodeInput("")
        toast({
          title: "Match code set",
          description: `Code "${data.code}" has been set for this match`,
        })
      } else {
        toast({
          title: "Failed to set code",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error setting match code:", error)
      toast({
        title: "Error",
        description: "Failed to set match code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, screenshot: file }))
    }
  }

  const handleSubmitResult = async () => {
    if (!formData.screenshot) {
      toast({
        title: "Screenshot required",
        description: "Please upload a screenshot of the match result",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("screenshot", formData.screenshot)
      if (formData.score) formDataToSend.append("score", formData.score)
      if (formData.resultNotes) formDataToSend.append("result_notes", formData.resultNotes)

      const response = await fetch(`/api/matches/${match.id}/result`, {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Result submitted",
          description: "Your match result has been submitted successfully",
        })
        setFormData({ score: "", resultNotes: "", screenshot: null })
        fetchMatchResults()
        onResultSubmitted?.()
      } else {
        toast({
          title: "Submission failed",
          description: data.error || "Failed to submit result",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error submitting result:", error)
      toast({
        title: "Error",
        description: "Failed to submit result",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyMatchCode = () => {
    if (matchCode) {
      navigator.clipboard.writeText(matchCode)
      toast({
        title: "Code copied",
        description: "Match code copied to clipboard",
      })
    }
  }

  const getPlayerName = (playerId) => {
    if (playerId === match.player1_id) return match.player1?.username || match.player1?.full_name || "Player 1"
    if (playerId === match.player2_id) return match.player2?.username || match.player2?.full_name || "Player 2"
    return "Unknown Player"
  }

  if (!isParticipant) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="bg-slate-900 border-slate-700 max-w-md w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Access Restricted</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-400">Only match participants can access match details</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <GamepadIcon className="w-5 h-5" />
              Match {match.match_number} - Round {match.round}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {getPlayerName(match.player1_id)}
              </div>
              <span>vs</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {getPlayerName(match.player2_id)}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "code"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Match Code
            </button>
            <button
              onClick={() => setActiveTab("result")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "result"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Submit Result
            </button>
          </div>

          <div className="p-6">
            {/* Match Code Tab */}
            {activeTab === "code" && (
              <div className="space-y-6">
                {matchCode ? (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <Key className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-medium">Match Code Set</span>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-2xl font-mono font-bold text-white tracking-wider">{matchCode}</div>
                        </div>
                        <Button
                          onClick={copyMatchCode}
                          variant="outline"
                          className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                        <p className="text-gray-400 text-sm">Share this code with your opponent to start the match</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardContent className="pt-6 space-y-4">
                      <div className="text-center">
                        <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Set Match Code</h3>
                        <p className="text-gray-400 text-sm mb-6">
                          The first player to submit sets the official match code
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-white font-medium">Enter Match Code</Label>
                          <Input
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                            placeholder="e.g., ABC123"
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            maxLength={10}
                          />
                          <p className="text-gray-400 text-xs mt-1">Use the room/lobby code from your game</p>
                        </div>

                        <Button
                          onClick={handleSetMatchCode}
                          disabled={loading || !codeInput.trim()}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Setting Code...
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 mr-2" />
                              Set Match Code
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Result Submission Tab */}
            {activeTab === "result" && (
              <div className="space-y-6">
                {userResult ? (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Result Submitted
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                      {userResult.score && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white font-medium">{userResult.score}</span>
                        </div>
                      )}
                      {userResult.result_notes && (
                        <div>
                          <span className="text-gray-400 block mb-1">Notes:</span>
                          <p className="text-white text-sm bg-slate-700 p-2 rounded">{userResult.result_notes}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 block mb-2">Screenshot:</span>
                        <img
                          src={userResult.screenshot_url || "/placeholder.svg"}
                          alt="Match result"
                          className="w-full max-w-sm rounded-lg"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Submit Match Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Score Input */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Your Score (Optional)</Label>
                        <Input
                          value={formData.score}
                          onChange={(e) => setFormData((prev) => ({ ...prev, score: e.target.value }))}
                          placeholder="e.g., 3-1, 2-0, etc."
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      {/* Screenshot Upload */}
                      <div className="space-y-4">
                        <Label className="text-white font-medium">Match Screenshot (Required)</Label>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="screenshot-upload"
                            disabled={loading}
                          />
                          <label htmlFor="screenshot-upload" className="cursor-pointer">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">Upload Match Screenshot</p>
                            <p className="text-gray-400 text-sm">Click to select image</p>
                            <Button type="button" variant="outline" className="mt-4 bg-transparent" disabled={loading}>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </label>
                        </div>

                        {/* Screenshot Preview */}
                        {formData.screenshot && (
                          <div className="text-center">
                            <p className="text-green-400 text-sm mb-2">
                              Screenshot selected: {formData.screenshot.name}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFormData((prev) => ({ ...prev, screenshot: null }))}
                              className="border-red-600 text-red-400 hover:bg-red-600/10"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Additional Notes (Optional)</Label>
                        <Textarea
                          value={formData.resultNotes}
                          onChange={(e) => setFormData((prev) => ({ ...prev, resultNotes: e.target.value }))}
                          placeholder="Any additional comments about the match..."
                          className="bg-slate-700 border-slate-600 text-white"
                          rows={3}
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleSubmitResult}
                        disabled={loading || !formData.screenshot}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 mr-2" />
                            Submit Result
                          </>
                        )}
                      </Button>

                      <p className="text-gray-400 text-xs text-center">
                        Your result will be reviewed by the tournament organizer
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Other Player's Result */}
                {otherPlayerResult && (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" />
                        Opponent's Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge variant="secondary">Submitted</Badge>
                      </div>
                      {otherPlayerResult.score && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white font-medium">{otherPlayerResult.score}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 block mb-2">Screenshot:</span>
                        <img
                          src={otherPlayerResult.screenshot_url || "/placeholder.svg"}
                          alt="Opponent's result"
                          className="w-full max-w-sm rounded-lg"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
