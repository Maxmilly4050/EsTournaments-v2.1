"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Trophy,
  Users,
  DollarSign,
  Settings,
  Globe,
  Shield,
  Clock,
  Monitor,
  Search,
  Gamepad2,
  Star,
  Award,
  Zap,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const games = [
  "eFootball 2026",
  "FC Mobile",
  "League of Legends",
  "Counter-Strike 2",
  "Valorant",
  "Dota 2",
  "Overwatch 2",
  "Rocket League",
  "Street Fighter 6",
  "Tekken 8",
  "Fortnite",
  "Apex Legends",
  "Call of Duty",
  "FIFA 24",
  "Mortal Kombat 1",
]

const platforms = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile (iOS)", "Mobile (Android)", "Mixed"]

const countries = [
  "Tanzania",
  "Kenya",
  "Uganda",
  "Rwanda",
  "Burundi",
  "South Sudan",
  "Ethiopia",
  "Somalia",
  "South Africa",
  "Nigeria",
  "Ghana",
  "Global",
]

export default function CreateTournamentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [gameSearch, setGameSearch] = useState("")
  const [collapsedSections, setCollapsedSections] = useState({})

  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    game: "",
    description: "",

    // Tournament Structure
    tournamentType: "single_elimination",
    bracketSize: "16",

    // Financial
    isFree: true,
    entryFeeAmount: "",
    entryFeeCurrency: "TZS",
    prizePool: "",
    prizeStructure: {
      winner: 50,
      runnerUp: 30,
      third: 20,
      custom: false,
    },

    // Scheduling
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    matchScheduleType: "auto",

    // Rules & Settings
    matchRules: {
      matchDuration: "",
      mapSelection: "",
      winConditions: "",
      customRules: "",
    },
    resultSubmissionMethod: "screenshot",

    // Platform & Streaming
    platformDevice: "",
    streamingEnabled: false,
    streamingLink: "",

    // Contact & Support
    hostContactEmail: "",
    hostContactChat: "",

    // Restrictions & Requirements
    visibility: "public",
    geographicalRestrictions: "",
    participantRequirements: {
      minAge: "",
      maxAge: "",
      skillRank: "",
      verifiedAccount: false,
    },

    // Additional
    disputeResolutionRules: "",
    additionalNotes: "",
    hostDetails: {
      contactEmail: "",
      contactChat: "",
      contactPhone: "",
      organizationName: "",
      experienceLevel: "beginner",
      preferredContactMethod: "email",
      bio: "",
      socialLinks: {
        discord: "",
        twitter: "",
        twitch: "",
      },
    },
  })

  const updateFormData = (updates) => {
    try {
      setFormData((prev) => ({
        ...prev,
        ...updates,
      }))
    } catch (error) {
      console.error("Error updating form data:", error)
    }
  }

  const updateNestedFormData = (path, value) => {
    try {
      setFormData((prev) => {
        const newData = { ...prev }
        const keys = path.split(".")
        let current = newData

        // Ensure all parent objects exist with proper initialization
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (!current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) {
            // Initialize with proper default structure for known objects
            if (key === "participantRequirements") {
              current[key] = {
                minAge: "",
                maxAge: "",
                skillRank: "",
                verifiedAccount: false,
              }
            } else if (key === "matchRules") {
              current[key] = {
                matchDuration: "",
                mapSelection: "",
                winConditions: "",
              }
            } else if (key === "prizeStructure") {
              current[key] = {
                winner: 50,
                runnerUp: 30,
                third: 20,
              }
            } else if (key === "hostDetails") {
              current[key] = {
                contactEmail: "",
                contactChat: "",
                contactPhone: "",
                organizationName: "",
                experienceLevel: "beginner",
                preferredContactMethod: "email",
                bio: "",
                socialLinks: {
                  discord: "",
                  twitter: "",
                  twitch: "",
                },
              }
            } else {
              current[key] = {}
            }
          }
          current = current[key]
        }

        const finalKey = keys[keys.length - 1]
        current[finalKey] = value
        return newData
      })
    } catch (error) {
      console.error("Error updating nested form data:", error, { path, value })
    }
  }

  const getNestedValue = (path, defaultValue = "") => {
    try {
      const keys = path.split(".")
      let current = formData

      for (const key of keys) {
        if (current && typeof current === "object" && !Array.isArray(current) && key in current) {
          current = current[key]
        } else {
          return defaultValue
        }
      }

      if (current === null || current === undefined) {
        return defaultValue
      }

      // Ensure we return the correct type based on the default value
      if (typeof defaultValue === "boolean") {
        return Boolean(current)
      }
      if (typeof defaultValue === "number") {
        return Number.parseFloat(current) || defaultValue
      }

      return String(current)
    } catch (error) {
      console.error("Error getting nested value:", error, { path, defaultValue })
      return defaultValue
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Only proceed if we're on the final step
    if (currentStep !== 4) {
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileCheckError && profileCheckError.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { error: profileCreateError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            username: user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          },
        ])

        if (profileCreateError) {
          console.error("Error creating profile:", profileCreateError)
          alert("Failed to create user profile. Please try again.")
          return
        }
      } else if (profileCheckError) {
        console.error("Error checking profile:", profileCheckError)
        alert("Failed to verify user profile. Please try again.")
        return
      }

      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .insert([
          {
            title: formData.name,
            game: formData.game,
            description: formData.description,
            tournament_type: formData.tournamentType,
            bracket_size: Number.parseInt(formData.bracketSize),
            max_participants: Number.parseInt(formData.bracketSize),
            is_free: formData.isFree,
            entry_fee_amount: formData.isFree ? 0 : Number.parseFloat(formData.entryFeeAmount) || 0,
            entry_fee_currency: formData.entryFeeCurrency,
            prize_pool: formData.prizePool,
            prize_structure: formData.prizeStructure,
            start_date: formData.startDate ? new Date(formData.startDate).toISOString() : null,
            end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            registration_deadline: formData.registrationDeadline
              ? new Date(formData.registrationDeadline).toISOString()
              : null,
            match_rules: formData.matchRules,
            result_submission_method: formData.resultSubmissionMethod,
            platform_device: formData.platformDevice,
            streaming_enabled: formData.streamingEnabled,
            streaming_link: formData.streamingLink || null,
            host_contact_email: formData.hostDetails.contactEmail,
            host_contact_chat: formData.hostDetails.contactChat,
            dispute_resolution_rules: formData.disputeResolutionRules,
            geographical_restrictions: formData.geographicalRestrictions,
            participant_requirements: formData.participantRequirements,
            visibility: formData.visibility,
            additional_notes: formData.additionalNotes,
            organizer_id: user.id,
          },
        ])
        .select()

      if (tournamentError) {
        console.error("Error creating tournament:", tournamentError)
        alert("Failed to create tournament. Please try again.")
        return
      }

      console.log("[v0] Tournament created successfully:", tournamentData[0])

      router.push(`/tournaments/${tournamentData[0].id}`)
    } catch (error) {
      console.error("Error:", error)
      alert("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    try {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    } catch (error) {
      console.error("Error navigating to next step:", error)
    }
  }

  const prevStep = () => {
    try {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
    } catch (error) {
      console.error("Error navigating to previous step:", error)
    }
  }

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const filteredGames = games.filter((game) => game.toLowerCase().includes(gameSearch.toLowerCase()))

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Trophy className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Basic Information</h3>
          <p className="text-gray-400 text-sm">Set up your tournament's core details</p>
        </div>
      </div>

      {/* Tournament Identity */}
      <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            Tournament Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300 font-medium">
              Tournament Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Epic Gaming Championship 2024"
              required
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="game" className="text-gray-300 font-medium">
              Game Title *
            </Label>
            <div className="relative">
              <Select value={formData.game} onValueChange={(value) => updateFormData({ game: value })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white focus:border-blue-500 rounded-lg h-12">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search games..."
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  {filteredGames.map((game) => (
                    <SelectItem key={game} value={game} className="text-white hover:bg-slate-700 rounded">
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300 font-medium">
              Tournament Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Describe your tournament, what makes it special, and what participants can expect..."
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg min-h-[120px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Format */}
      <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-400" />
            Tournament Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tournamentType" className="text-gray-300 font-medium">
                Tournament Type *
              </Label>
              <Select
                value={formData.tournamentType}
                onValueChange={(value) => updateFormData({ tournamentType: value })}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                  <SelectItem value="single_elimination" className="text-white hover:bg-slate-700 rounded">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Single Elimination
                    </div>
                  </SelectItem>
                  <SelectItem value="double_elimination" className="text-white hover:bg-slate-700 rounded">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-400" />
                      Double Elimination
                    </div>
                  </SelectItem>
                  <SelectItem value="round_robin" className="text-white hover:bg-slate-700 rounded">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Round Robin
                    </div>
                  </SelectItem>
                  <SelectItem value="custom" className="text-white hover:bg-slate-700 rounded">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-400" />
                      Custom Format
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bracketSize" className="text-gray-300 font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Bracket Size *
              </Label>
              <Select value={formData.bracketSize} onValueChange={(value) => updateFormData({ bracketSize: value })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                  {[8, 16, 32, 64, 128].map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-white hover:bg-slate-700 rounded">
                      {size} Players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformDevice" className="text-gray-300 font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Platform/Device *
              </Label>
              <Select
                value={formData.platformDevice}
                onValueChange={(value) => updateFormData({ platformDevice: value })}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform} className="text-white hover:bg-slate-700 rounded">
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <DollarSign className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Financial Settings</h3>
          <p className="text-gray-400 text-sm">Configure entry fees and prize distribution</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <Checkbox
              id="isFree"
              checked={formData.isFree}
              onCheckedChange={(checked) => updateFormData({ isFree: checked })}
              className="border-slate-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <Label htmlFor="isFree" className="text-gray-300 font-medium cursor-pointer">
              Free Tournament (No Entry Fee)
            </Label>
            {formData.isFree && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">FREE</Badge>}
          </div>

          {!formData.isFree && (
            <div className="space-y-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entryFeeAmount" className="text-gray-300 font-medium">
                    Entry Fee Amount *
                  </Label>
                  <Input
                    id="entryFeeAmount"
                    type="number"
                    value={formData.entryFeeAmount}
                    onChange={(e) => updateFormData({ entryFeeAmount: e.target.value })}
                    placeholder="1000"
                    className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryFeeCurrency" className="text-gray-300 font-medium">
                    Currency
                  </Label>
                  <Select
                    value={formData.entryFeeCurrency}
                    onValueChange={(value) => updateFormData({ entryFeeCurrency: value })}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                      <SelectItem value="TZS" className="text-white hover:bg-slate-700 rounded">
                        TZS (Tanzanian Shilling)
                      </SelectItem>
                      <SelectItem value="USD" className="text-white hover:bg-slate-700 rounded">
                        USD (US Dollar)
                      </SelectItem>
                      <SelectItem value="EUR" className="text-white hover:bg-slate-700 rounded">
                        EUR (Euro)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool" className="text-gray-300 font-medium">
                  Total Prize Pool
                </Label>
                <Input
                  id="prizePool"
                  value={formData.prizePool}
                  onChange={(e) => updateFormData({ prizePool: e.target.value })}
                  placeholder="10,000 TZS"
                  className="bg-slate-700/50 border-slate-600/50 text-white focus:border-green-500 rounded-lg h-12"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-gray-300 font-medium">Prize Distribution (%)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="winner" className="text-sm text-gray-400 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      1st Place
                    </Label>
                    <Input
                      id="winner"
                      type="number"
                      value={formData.prizeStructure.winner}
                      onChange={(e) =>
                        updateNestedFormData("prizeStructure.winner", Number.parseInt(e.target.value) || 0)
                      }
                      className="bg-slate-700/50 border-slate-600/50 text-white focus:border-yellow-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="runnerUp" className="text-sm text-gray-400 flex items-center gap-1">
                      <Award className="w-3 h-3 text-gray-400" />
                      2nd Place
                    </Label>
                    <Input
                      id="runnerUp"
                      type="number"
                      value={formData.prizeStructure.runnerUp}
                      onChange={(e) =>
                        updateNestedFormData("prizeStructure.runnerUp", Number.parseInt(e.target.value) || 0)
                      }
                      className="bg-slate-700/50 border-slate-600/50 text-white focus:border-gray-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="third" className="text-sm text-gray-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-400" />
                      3rd Place
                    </Label>
                    <Input
                      id="third"
                      type="number"
                      value={formData.prizeStructure.third}
                      onChange={(e) =>
                        updateNestedFormData("prizeStructure.third", Number.parseInt(e.target.value) || 0)
                      }
                      className="bg-slate-700/50 border-slate-600/50 text-white focus:border-orange-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Rules & Schedule</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Start Date & Time *
          </Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => updateFormData({ startDate: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            End Date & Time *
          </Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => updateFormData({ endDate: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationDeadline" className="text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Registration Deadline
          </Label>
          <Input
            id="registrationDeadline"
            type="datetime-local"
            value={formData.registrationDeadline}
            onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-gray-300">Match Rules</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="matchDuration" className="text-sm text-gray-400">
              Match Duration
            </Label>
            <Input
              id="matchDuration"
              value={formData.matchRules.matchDuration}
              onChange={(e) => updateNestedFormData("matchRules.matchDuration", e.target.value)}
              placeholder="90 minutes"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapSelection" className="text-sm text-gray-400">
              Map/Arena Selection
            </Label>
            <Input
              id="mapSelection"
              value={formData.matchRules.mapSelection}
              onChange={(e) => updateNestedFormData("matchRules.mapSelection", e.target.value)}
              placeholder="Random/Pick & Ban"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="winConditions" className="text-sm text-gray-400">
              Win Conditions
            </Label>
            <Input
              id="winConditions"
              value={formData.matchRules.winConditions}
              onChange={(e) => updateNestedFormData("matchRules.winConditions", e.target.value)}
              placeholder="Best of 3"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resultSubmissionMethod" className="text-gray-300">
          Result Submission Method
        </Label>
        <Select
          value={formData.resultSubmissionMethod}
          onValueChange={(value) => updateFormData({ resultSubmissionMethod: value })}
        >
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="screenshot" className="text-white hover:bg-slate-600">
              Screenshot Upload
            </SelectItem>
            <SelectItem value="api" className="text-white hover:bg-slate-600">
              API Integration
            </SelectItem>
            <SelectItem value="manual" className="text-white hover:bg-slate-600">
              Manual Entry
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="streamingEnabled"
            checked={formData.streamingEnabled}
            onCheckedChange={(checked) => updateFormData({ streamingEnabled: checked })}
            className="border-slate-600"
          />
          <Label htmlFor="streamingEnabled" className="text-gray-300">
            Enable Live Streaming
          </Label>
        </div>

        {formData.streamingEnabled && (
          <div className="space-y-2">
            <Label htmlFor="streamingLink" className="text-gray-300">
              Streaming Link
            </Label>
            <Input
              id="streamingLink"
              value={formData.streamingLink}
              onChange={(e) => updateFormData({ streamingLink: e.target.value })}
              placeholder="https://twitch.tv/your-channel"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => {
    try {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Host Details & Requirements</h3>
          </div>

          <div className="space-y-4">
            <Label className="text-gray-300">Host Contact Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hostContactEmail" className="text-gray-300">
                  Contact Email *
                </Label>
                <Input
                  id="hostContactEmail"
                  type="email"
                  value={formData.hostDetails.contactEmail}
                  onChange={(e) => updateNestedFormData("hostDetails.contactEmail", e.target.value)}
                  placeholder="tournament@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostContactChat" className="text-gray-300">
                  Discord/Chat Handle
                </Label>
                <Input
                  id="hostContactChat"
                  value={formData.hostDetails.contactChat}
                  onChange={(e) => updateNestedFormData("hostDetails.contactChat", e.target.value)}
                  placeholder="Discord: username#1234"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostContactPhone" className="text-gray-300">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="hostContactPhone"
                  value={formData.hostDetails.contactPhone}
                  onChange={(e) => updateNestedFormData("hostDetails.contactPhone", e.target.value)}
                  placeholder="+255 123 456 789"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod" className="text-gray-300">
                  Preferred Contact Method
                </Label>
                <Select
                  value={formData.hostDetails.preferredContactMethod}
                  onValueChange={(value) => updateNestedFormData("hostDetails.preferredContactMethod", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="email" className="text-white hover:bg-slate-600">
                      Email
                    </SelectItem>
                    <SelectItem value="discord" className="text-white hover:bg-slate-600">
                      Discord
                    </SelectItem>
                    <SelectItem value="phone" className="text-white hover:bg-slate-600">
                      Phone
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-gray-300">
                Organization/Team Name (Optional)
              </Label>
              <Input
                id="organizationName"
                value={formData.hostDetails.organizationName}
                onChange={(e) => updateNestedFormData("hostDetails.organizationName", e.target.value)}
                placeholder="Gaming Org or Team Name"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="text-gray-300">
                Tournament Hosting Experience
              </Label>
              <Select
                value={formData.hostDetails.experienceLevel}
                onValueChange={(value) => updateNestedFormData("hostDetails.experienceLevel", value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="beginner" className="text-white hover:bg-slate-600">
                    First Time Host
                  </SelectItem>
                  <SelectItem value="intermediate" className="text-white hover:bg-slate-600">
                    Some Experience
                  </SelectItem>
                  <SelectItem value="experienced" className="text-white hover:bg-slate-600">
                    Experienced Host
                  </SelectItem>
                  <SelectItem value="professional" className="text-white hover:bg-slate-600">
                    Professional Organizer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostBio" className="text-gray-300">
              Host Bio (Optional)
            </Label>
            <Textarea
              id="hostBio"
              value={formData.hostDetails.bio}
              onChange={(e) => updateNestedFormData("hostDetails.bio", e.target.value)}
              placeholder="Tell participants about yourself and your experience with tournaments..."
              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility" className="text-gray-300 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Tournament Visibility
            </Label>
            <Select value={formData.visibility} onValueChange={(value) => updateFormData({ visibility: value })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="public" className="text-white hover:bg-slate-600">
                  Public (Listed on platform)
                </SelectItem>
                <SelectItem value="private" className="text-white hover:bg-slate-600">
                  Private (Invite-only)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participant Requirements */}
          <div className="space-y-4">
            <Label className="text-gray-300">Participant Requirements</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAge" className="text-sm text-gray-400">
                  Minimum Age
                </Label>
                <Input
                  id="minAge"
                  type="number"
                  value={getNestedValue("participantRequirements.minAge", "")}
                  onChange={(e) => updateNestedFormData("participantRequirements.minAge", e.target.value)}
                  placeholder="13"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skillRank" className="text-sm text-gray-400">
                  Required Skill Rank
                </Label>
                <Input
                  id="skillRank"
                  value={getNestedValue("participantRequirements.skillRank", "")}
                  onChange={(e) => updateNestedFormData("participantRequirements.skillRank", e.target.value)}
                  placeholder="Gold or above"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="verifiedAccount"
                checked={getNestedValue("participantRequirements.verifiedAccount", false)}
                onCheckedChange={(checked) =>
                  updateNestedFormData("participantRequirements.verifiedAccount", checked === true)
                }
                className="border-slate-600"
              />
              <Label htmlFor="verifiedAccount" className="text-gray-300">
                Require Verified Account
              </Label>
            </div>
          </div>

          {/* Dispute Resolution Rules */}
          <div className="space-y-2">
            <Label htmlFor="disputeResolutionRules" className="text-gray-300">
              Dispute Resolution Rules
            </Label>
            <Textarea
              id="disputeResolutionRules"
              value={formData.disputeResolutionRules}
              onChange={(e) => updateFormData({ disputeResolutionRules: e.target.value })}
              placeholder="Describe how disputes will be handled, evidence requirements, and decision process..."
              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes" className="text-gray-300">
              Additional Notes
            </Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
              placeholder="Any other important details, special conditions, or announcements..."
              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            />
          </div>
        </div>
      )
    } catch (error) {
      console.error("Error rendering step 4:", error)
      return (
        <div className="text-red-400 p-4 bg-red-900/20 rounded">
          Error loading form step. Please refresh the page and try again.
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 max-w-5xl mx-auto shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Tournament</h2>
                <p className="text-gray-400 text-sm font-normal">Step {currentStep} of 4</p>
              </div>
            </CardTitle>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1">
              {currentStep === 1 && "Basic Info"}
              {currentStep === 2 && "Financial"}
              {currentStep === 3 && "Rules & Schedule"}
              {currentStep === 4 && "Requirements"}
            </Badge>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="flex space-x-2 mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex-1 relative">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
                      : "bg-slate-600"
                  }`}
                />
                {step <= currentStep && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-50" />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Enhanced Navigation */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-700/50">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600 hover:border-slate-500 rounded-lg px-6 py-3 transition-all duration-200"
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-8 py-3 font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg px-8 py-3 font-medium shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Creating Tournament..." : "Create Tournament"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
