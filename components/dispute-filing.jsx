"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Upload, Flag, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

export function DisputeFiling({ matchResult, currentUser, onDisputeFiled }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dispute_reason: "",
    evidence_files: [],
  })

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setLoading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `dispute-evidence/${matchResult.match_id}/${fileName}`

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
        evidence_files: [...prev.evidence_files, ...uploadedUrls],
      }))

      toast({
        title: "Evidence uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload evidence. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeEvidence = (index) => {
    setFormData((prev) => ({
      ...prev,
      evidence_files: prev.evidence_files.filter((_, i) => i !== index),
    }))
  }

  const submitDispute = async () => {
    if (!formData.dispute_reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the dispute",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create the dispute
      const { error: disputeError } = await supabase.from("match_disputes").insert({
        match_id: matchResult.match_id,
        match_result_id: matchResult.id,
        disputed_by: currentUser.id,
        dispute_reason: formData.dispute_reason,
        dispute_evidence: formData.evidence_files,
      })

      if (disputeError) throw disputeError

      // Update the match result status to disputed
      const { error: resultError } = await supabase
        .from("match_results")
        .update({ status: "disputed" })
        .eq("id", matchResult.id)

      if (resultError) throw resultError

      toast({
        title: "Dispute filed",
        description: "Your dispute has been submitted for review by the tournament organizer",
      })

      onDisputeFiled?.()
    } catch (error) {
      console.error("Dispute error:", error)
      toast({
        title: "Dispute failed",
        description: "Failed to file dispute. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (playerId) => {
    if (playerId === matchResult.matches?.player1_id) {
      return matchResult.matches?.player1?.username || matchResult.matches?.player1?.full_name || "Player 1"
    }
    if (playerId === matchResult.matches?.player2_id) {
      return matchResult.matches?.player2?.username || matchResult.matches?.player2?.full_name || "Player 2"
    }
    return "Unknown Player"
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-400" />
          File Match Dispute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Result Summary */}
        <div className="bg-slate-700 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3">Disputing Result</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Match:</span>
              <span className="text-white ml-2">
                Round {matchResult.matches?.round} - Match {matchResult.matches?.match_number}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Winner:</span>
              <span className="text-white ml-2">{getPlayerName(matchResult.winner_id)}</span>
            </div>
            <div>
              <span className="text-gray-400">Score:</span>
              <span className="text-white ml-2">
                {matchResult.player1_score} - {matchResult.player2_score}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <Badge variant="secondary" className="ml-2 bg-yellow-600 text-white">
                {matchResult.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Dispute Reason *</Label>
          <Textarea
            value={formData.dispute_reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, dispute_reason: e.target.value }))}
            placeholder="Explain why you are disputing this result. Be specific about what happened and why the result is incorrect..."
            className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
          />
          <p className="text-gray-400 text-xs">
            Provide detailed information about the issue. Include specific details about what went wrong.
          </p>
        </div>

        {/* Evidence Upload */}
        <div className="space-y-4">
          <Label className="text-white font-medium">Supporting Evidence (Optional)</Label>
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="evidence-upload"
              disabled={loading}
            />
            <label htmlFor="evidence-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Upload Evidence</p>
              <p className="text-gray-400 text-sm">Screenshots, videos, or other proof supporting your dispute</p>
              <Button type="button" variant="outline" className="mt-4 bg-transparent" disabled={loading}>
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Uploading..." : "Choose Files"}
              </Button>
            </label>
          </div>

          {/* Evidence Preview */}
          {formData.evidence_files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.evidence_files.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => removeEvidence(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium mb-1">Important Notice</h4>
              <p className="text-yellow-200 text-sm">
                Filing false disputes may result in penalties or removal from the tournament. Only dispute results if
                you have legitimate concerns about the accuracy of the reported outcome.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={submitDispute}
          disabled={loading || !formData.dispute_reason.trim()}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Filing Dispute...
            </>
          ) : (
            <>
              <Flag className="w-4 h-4 mr-2" />
              File Dispute
            </>
          )}
        </Button>

        <p className="text-gray-400 text-xs text-center">
          Your dispute will be reviewed by the tournament organizer. You will be notified of the decision.
        </p>
      </CardContent>
    </Card>
  )
}
