"use client"

import { useState, useEffect } from "react"
import { X, Save, AlertTriangle, Info, Clock, Trophy, Users, DollarSign, Eye, Bell } from "lucide-react"

export function TournamentSettings({ tournament, isOpen, onClose, onSave }) {
  const [settings, setSettings] = useState({
    title: tournament?.title || "",
    description: tournament?.description || "",
    game: tournament?.game || "",
    tournament_type: tournament?.tournament_type || "single_elimination",
    max_participants: tournament?.max_participants || 8,
    entry_fee: tournament?.entry_fee || 0,
    prize_pool: tournament?.prize_pool || 0,
    start_date: tournament?.start_date || "",
    end_date: tournament?.end_date || "",
    registration_deadline: tournament?.registration_deadline || "",
    is_public: tournament?.is_public ?? true,
    auto_advance_rounds: tournament?.auto_advance_rounds ?? false,
    allow_disputes: tournament?.allow_disputes ?? true,
    max_dispute_time: tournament?.max_dispute_time || 24,
    round_duration: tournament?.round_duration || 48,
    require_screenshots: tournament?.require_screenshots ?? true,
    email_notifications: tournament?.email_notifications ?? true,
    discord_notifications: tournament?.discord_notifications ?? false,
    minimum_rank: tournament?.minimum_rank || "",
    maximum_rank: tournament?.maximum_rank || "",
    region_restriction: tournament?.region_restriction || "",
    platform: tournament?.platform || "",
  })

  const [activeTab, setActiveTab] = useState("basic")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (tournament) {
      setSettings({
        title: tournament.title || "",
        description: tournament.description || "",
        game: tournament.game || "",
        tournament_type: tournament.tournament_type || "single_elimination",
        max_participants: tournament.max_participants || 8,
        entry_fee: tournament.entry_fee || 0,
        prize_pool: tournament.prize_pool || 0,
        start_date: tournament.start_date || "",
        end_date: tournament.end_date || "",
        registration_deadline: tournament.registration_deadline || "",
        is_public: tournament.is_public ?? true,
        auto_advance_rounds: tournament.auto_advance_rounds ?? false,
        allow_disputes: tournament.allow_disputes ?? true,
        max_dispute_time: tournament.max_dispute_time || 24,
        round_duration: tournament.round_duration || 48,
        require_screenshots: tournament.require_screenshots ?? true,
        email_notifications: tournament.email_notifications ?? true,
        discord_notifications: tournament.discord_notifications ?? false,
        minimum_rank: tournament.minimum_rank || "",
        maximum_rank: tournament.maximum_rank || "",
        region_restriction: tournament.region_restriction || "",
        platform: tournament.platform || "",
      })
    }
  }, [tournament])

  const validateSettings = () => {
    const newErrors = {}

    if (!settings.title.trim()) newErrors.title = "Tournament title is required"
    if (!settings.game.trim()) newErrors.game = "Game selection is required"
    if (settings.max_participants < 2) newErrors.max_participants = "Minimum 2 participants required"
    if (settings.max_participants > 128) newErrors.max_participants = "Maximum 128 participants allowed"
    if (settings.entry_fee < 0) newErrors.entry_fee = "Entry fee cannot be negative"
    if (settings.prize_pool < 0) newErrors.prize_pool = "Prize pool cannot be negative"

    if (settings.start_date && settings.end_date) {
      if (new Date(settings.start_date) >= new Date(settings.end_date)) {
        newErrors.end_date = "End date must be after start date"
      }
    }

    if (settings.registration_deadline && settings.start_date) {
      if (new Date(settings.registration_deadline) >= new Date(settings.start_date)) {
        newErrors.registration_deadline = "Registration deadline must be before start date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateSettings()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const updatedTournament = await response.json()
        onSave(updatedTournament)
        onClose()
      } else {
        const error = await response.json()
        setErrors({ general: error.message || "Failed to save settings" })
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "format", label: "Format & Rules", icon: Trophy },
    { id: "participants", label: "Participants", icon: Users },
    { id: "timing", label: "Timing", icon: Clock },
    { id: "prizes", label: "Prizes & Fees", icon: DollarSign },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "notifications", label: "Notifications", icon: Bell },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Tournament Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{errors.general}</span>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Title *</label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.title ? "border-red-500" : "border-slate-600"
                    }`}
                    placeholder="Enter tournament title"
                  />
                  {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    rows={4}
                    placeholder="Describe your tournament..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Game *</label>
                  <select
                    value={settings.game}
                    onChange={(e) => setSettings({ ...settings, game: e.target.value })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.game ? "border-red-500" : "border-slate-600"
                    }`}
                  >
                    <option value="">Select a game</option>
                    <option value="eFootball 2026">eFootball 2026</option>
                    <option value="FC Mobile">FC Mobile</option>
                    <option value="FIFA 24">FIFA 24</option>
                    <option value="Call of Duty">Call of Duty</option>
                    <option value="Fortnite">Fortnite</option>
                    <option value="Valorant">Valorant</option>
                  </select>
                  {errors.game && <p className="text-red-400 text-sm mt-1">{errors.game}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
                  <select
                    value={settings.platform}
                    onChange={(e) => setSettings({ ...settings, platform: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Any Platform</option>
                    <option value="PC">PC</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                  </select>
                </div>
              </div>
            )}

            {/* Format & Rules Tab */}
            {activeTab === "format" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Format</label>
                  <select
                    value={settings.tournament_type}
                    onChange={(e) => setSettings({ ...settings, tournament_type: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="single_elimination">Single Elimination</option>
                    <option value="double_elimination">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="swiss">Swiss System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Round Duration (hours)</label>
                  <input
                    type="number"
                    value={settings.round_duration?.toString() || "48"}
                    onChange={(e) =>
                      setSettings({ ...settings, round_duration: Number.parseInt(e.target.value) || 48 })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    max="168"
                  />
                  <p className="text-slate-400 text-sm mt-1">How long players have to complete each round</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto_advance"
                      checked={settings.auto_advance_rounds}
                      onChange={(e) => setSettings({ ...settings, auto_advance_rounds: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <label htmlFor="auto_advance" className="text-slate-300">
                      Auto-advance rounds when deadline is reached
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="require_screenshots"
                      checked={settings.require_screenshots}
                      onChange={(e) => setSettings({ ...settings, require_screenshots: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <label htmlFor="require_screenshots" className="text-slate-300">
                      Require screenshot proof for match results
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allow_disputes"
                      checked={settings.allow_disputes}
                      onChange={(e) => setSettings({ ...settings, allow_disputes: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <label htmlFor="allow_disputes" className="text-slate-300">
                      Allow players to dispute match results
                    </label>
                  </div>

                  {settings.allow_disputes && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Dispute Time Limit (hours)
                      </label>
                      <input
                        type="number"
                        value={settings.max_dispute_time?.toString() || "24"}
                        onChange={(e) =>
                          setSettings({ ...settings, max_dispute_time: Number.parseInt(e.target.value) || 24 })
                        }
                        className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        min="1"
                        max="168"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Participants *</label>
                  <select
                    value={settings.max_participants?.toString() || "8"}
                    onChange={(e) =>
                      setSettings({ ...settings, max_participants: Number.parseInt(e.target.value) || 8 })
                    }
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.max_participants ? "border-red-500" : "border-slate-600"
                    }`}
                  >
                    <option value={4}>4 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                    <option value={32}>32 Players</option>
                    <option value={64}>64 Players</option>
                    <option value={128}>128 Players</option>
                  </select>
                  {errors.max_participants && <p className="text-red-400 text-sm mt-1">{errors.max_participants}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Rank Requirement</label>
                  <input
                    type="text"
                    value={settings.minimum_rank}
                    onChange={(e) => setSettings({ ...settings, minimum_rank: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g., Gold III, 1500 MMR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Rank Requirement</label>
                  <input
                    type="text"
                    value={settings.maximum_rank}
                    onChange={(e) => setSettings({ ...settings, maximum_rank: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g., Diamond I, 2500 MMR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Region Restriction</label>
                  <select
                    value={settings.region_restriction}
                    onChange={(e) => setSettings({ ...settings, region_restriction: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">No Restriction</option>
                    <option value="NA">North America</option>
                    <option value="EU">Europe</option>
                    <option value="AS">Asia</option>
                    <option value="SA">South America</option>
                    <option value="AF">Africa</option>
                    <option value="OC">Oceania</option>
                  </select>
                </div>
              </div>
            )}

            {/* Timing Tab */}
            {activeTab === "timing" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={settings.registration_deadline}
                    onChange={(e) => setSettings({ ...settings, registration_deadline: e.target.value })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.registration_deadline ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.registration_deadline && (
                    <p className="text-red-400 text-sm mt-1">{errors.registration_deadline}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Start Date</label>
                  <input
                    type="datetime-local"
                    value={settings.start_date}
                    onChange={(e) => setSettings({ ...settings, start_date: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tournament End Date</label>
                  <input
                    type="datetime-local"
                    value={settings.end_date}
                    onChange={(e) => setSettings({ ...settings, end_date: e.target.value })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.end_date ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.end_date && <p className="text-red-400 text-sm mt-1">{errors.end_date}</p>}
                </div>
              </div>
            )}

            {/* Prizes & Fees Tab */}
            {activeTab === "prizes" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Entry Fee (TZS)</label>
                  <input
                    type="number"
                    value={settings.entry_fee?.toString() || "0"}
                    onChange={(e) => setSettings({ ...settings, entry_fee: Number.parseFloat(e.target.value) || 0 })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.entry_fee ? "border-red-500" : "border-slate-600"
                    }`}
                    min="0"
                    step="1000"
                  />
                  {errors.entry_fee && <p className="text-red-400 text-sm mt-1">{errors.entry_fee}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prize Pool (TZS)</label>
                  <input
                    type="number"
                    value={settings.prize_pool?.toString() || "0"}
                    onChange={(e) => setSettings({ ...settings, prize_pool: Number.parseFloat(e.target.value) || 0 })}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      errors.prize_pool ? "border-red-500" : "border-slate-600"
                    }`}
                    min="0"
                    step="1000"
                  />
                  {errors.prize_pool && <p className="text-red-400 text-sm mt-1">{errors.prize_pool}</p>}
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Prize Distribution Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">1st Place:</span>
                      <span className="text-white">{Math.floor(settings.prize_pool * 0.6).toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">2nd Place:</span>
                      <span className="text-white">{Math.floor(settings.prize_pool * 0.3).toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">3rd Place:</span>
                      <span className="text-white">{Math.floor(settings.prize_pool * 0.1).toLocaleString()} TZS</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={settings.is_public}
                    onChange={(e) => setSettings({ ...settings, is_public: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <label htmlFor="is_public" className="text-slate-300">
                    Make tournament publicly visible
                  </label>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Privacy Settings</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white">Public Tournament</p>
                        <p className="text-slate-400">Anyone can view and join this tournament</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white">Private Tournament</p>
                        <p className="text-slate-400">Only invited players can view and join</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="email_notifications"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <label htmlFor="email_notifications" className="text-slate-300">
                      Send email notifications to participants
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="discord_notifications"
                      checked={settings.discord_notifications}
                      onChange={(e) => setSettings({ ...settings, discord_notifications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <label htmlFor="discord_notifications" className="text-slate-300">
                      Send Discord notifications (if configured)
                    </label>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Notification Events</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>• Tournament registration opens/closes</p>
                    <p>• New round starts</p>
                    <p>• Match results submitted</p>
                    <p>• Disputes filed</p>
                    <p>• Tournament completion</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <div className="text-slate-400 text-sm">* Required fields</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentSettings
