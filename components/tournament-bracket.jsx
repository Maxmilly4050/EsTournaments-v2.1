"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { Trophy, Users, Clock, CheckCircle, XCircle, Upload } from "lucide-react"

export default function TournamentBracket({ tournamentId, tournamentType, isOrganizer = false }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [reportingResult, setReportingResult] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('match-code')
  const [resultForm, setResultForm] = useState({
    winner_id: '',
    player1_score: 0,
    player2_score: 0,
    screenshot_url: '',
    match_room_code: '',
    notes: ''
  })

  useEffect(() => {
    fetchMatches()
  }, [tournamentId])

  // Check user authentication with session management
  useEffect(() => {
    async function checkAuth() {
      try {
        // First try to get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setUser(null)
        } else if (!session) {
          console.log('No active session found')
          setUser(null)
        } else {
          // Session exists, get user data
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError) {
            console.error('User error:', userError)
            // Try to refresh session if user fetch fails
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Session refresh failed:', refreshError)
              setUser(null)
            } else {
              // Retry getting user after refresh
              const { data: { user: refreshedUser } } = await supabase.auth.getUser()
              setUser(refreshedUser)
            }
          } else {
            setUser(user)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Re-check authentication when auth state changes
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchMatches = async () => {
    try {
      // Add safety check for tournamentId
      if (!tournamentId) {
        console.error('Tournament ID is required to fetch matches')
        setMatches([])
        return
      }

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:profiles!player1_id (
            id,
            username,
            full_name
          ),
          player2:profiles!player2_id (
            id,
            username,
            full_name
          ),
          winner:profiles!winner_id (
            id,
            username,
            full_name
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('round')
        .order('match_number')

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      setMatches(data || [])
      console.log('[v0] Fetched matches successfully:', data?.length || 0, 'matches')
    } catch (error) {
      console.error('Error fetching matches:', error)
      // Provide more specific error information
      if (error.message) {
        console.error('Error message:', error.message)
      }
      if (error.details) {
        console.error('Error details:', error.details)
      }
      // Set empty matches array on error to prevent UI issues
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleReportResult = async () => {
    try {
      setReportingResult(true)

      // Check user authentication before making API call
      if (!user) {
        alert('You must be logged in to report match results. Please log in and try again.')
        return
      }

      // Verify user is participant or organizer
      const isParticipant = selectedMatch?.player1_id === user?.id || selectedMatch?.player2_id === user?.id
      if (!isParticipant && !isOrganizer) {
        alert('You can only report results for matches you are participating in.')
        return
      }

      // Enhanced session validation with retry logic
      try {
        console.log('Validating session before API call...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        // Check if session exists and is still valid
        if (session && !sessionError) {
          const expiresAt = new Date(session.expires_at * 1000)
          const now = new Date()
          const timeUntilExpiry = expiresAt.getTime() - now.getTime()

          // If session expires within 5 minutes, proactively refresh
          if (timeUntilExpiry > 5 * 60 * 1000) {
            console.log('Session is valid, proceeding with API call')
          } else {
            console.log('Session expires soon, attempting refresh...')
            await attemptSessionRefresh()
          }
        } else {
          console.log('No valid session found, attempting refresh...')
          await attemptSessionRefresh()
        }
      } catch (sessionValidationError) {
        console.error('Session validation failed:', sessionValidationError)
        handleSessionFailure()
        return
      }

      // Helper function to attempt session refresh with retry logic
      async function attemptSessionRefresh(retryCount = 0) {
        const maxRetries = 2

        try {
          console.log(`Session refresh attempt ${retryCount + 1}/${maxRetries + 1}`)
          const { error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            if (retryCount < maxRetries) {
              console.log('Refresh failed, retrying in 1 second...')
              await new Promise(resolve => setTimeout(resolve, 1000))
              return attemptSessionRefresh(retryCount + 1)
            } else {
              throw new Error('Session refresh failed after retries')
            }
          } else {
            console.log('Session refreshed successfully')
          }
        } catch (refreshError) {
          console.error('Session refresh error:', refreshError)
          throw refreshError
        }
      }

      // Helper function to handle session failure gracefully
      function handleSessionFailure() {
        console.log('All session recovery attempts failed')
        if (confirm('Your session has expired and could not be refreshed automatically. Would you like to refresh the page to log in again?')) {
          window.location.reload()
        }
      }

      const response = await fetch(`/api/tournaments/matches/${selectedMatch.id}/report-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(resultForm)
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchMatches() // Refresh matches
        setSelectedMatch(null)
        setResultForm({
          winner_id: '',
          player1_score: 0,
          player2_score: 0,
          screenshot_url: '',
          match_room_code: '',
          notes: ''
        })
      } else {
        // Handle specific authentication errors with improved UX
        if (result.error === 'Authentication failed' || result.error === 'User not authenticated') {
          if (confirm('Your session has expired. Would you like to refresh the page to log in again?')) {
            window.location.reload()
          }
        } else if (result.error === 'Insufficient permissions') {
          alert('You do not have permission to report results for this match.')
        } else {
          alert(result.error || 'Failed to report result')
        }
      }
    } catch (error) {
      console.error('Error reporting result:', error)
      alert('Failed to report result. Please check your internet connection and try again.')
    } finally {
      setReportingResult(false)
    }
  }

  const openMatchDialog = (match) => {
    setSelectedMatch(match)
    setResultForm({
      winner_id: '',
      player1_score: 0,
      player2_score: 0,
      screenshot_url: '',
      notes: ''
    })
  }

  const renderMatch = (match) => {
    const isCompleted = match.status === 'completed'
    const isPending = match.status === 'pending'
    const hasPlayers = match.player1_id && match.player2_id

    return (
      <Card
        key={match.id}
        className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
          isCompleted 
            ? 'bg-green-50 border-green-200' 
            : isPending && hasPlayers 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
        }`}
        onClick={() => hasPlayers && openMatchDialog(match)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={isCompleted ? 'success' : isPending ? 'default' : 'secondary'}>
              {match.match_type === 'final' ? 'Final' :
               match.match_type === 'grand_final' ? 'Grand Final' :
               `Round ${match.round}`}
            </Badge>
            <span className="text-sm text-gray-500">Match #{match.match_number}</span>
          </div>

          <div className="space-y-3">
            {/* Player 1 */}
            <div className={`flex items-center justify-between p-2 rounded ${
              match.winner_id === match.player1_id ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                {match.winner_id === match.player1_id && (
                  <Trophy className="w-4 h-4 text-yellow-500" />
                )}
                <span className="font-medium">
                  {match.player1?.full_name || match.player1?.username || 'TBD'}
                </span>
              </div>
              {isCompleted && (
                <span className="text-lg font-bold">{match.player1_score}</span>
              )}
            </div>

            {/* VS Divider */}
            <div className="text-center text-gray-400 text-sm font-medium">VS</div>

            {/* Player 2 */}
            <div className={`flex items-center justify-between p-2 rounded ${
              match.winner_id === match.player2_id ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                {match.winner_id === match.player2_id && (
                  <Trophy className="w-4 h-4 text-yellow-500" />
                )}
                <span className="font-medium">
                  {match.player2?.full_name || match.player2?.username || 'TBD'}
                </span>
              </div>
              {isCompleted && (
                <span className="text-lg font-bold">{match.player2_score}</span>
              )}
            </div>
          </div>

          {/* Match Status */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : isPending && hasPlayers ? (
                <Clock className="w-4 h-4 text-blue-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {isCompleted
                  ? 'Completed'
                  : isPending && hasPlayers
                    ? 'Pending'
                    : 'Awaiting Players'
                }
              </span>
            </div>

            {match.completed_at && (
              <span className="text-xs text-gray-400">
                {new Date(match.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderBracket = () => {
    if (tournamentType === 'round_robin') {
      return renderRoundRobinView()
    } else if (tournamentType === 'group_stage') {
      return renderGroupStageView()
    } else {
      return renderEliminationBracket()
    }
  }

  const renderEliminationBracket = () => {
    const rounds = {}
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = []
      }
      rounds[match.round].push(match)
    })

    return (
      <div className="space-y-8">
        {Object.entries(rounds).map(([roundNum, roundMatches]) => (
          <div key={roundNum} className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              {roundNum == Math.max(...Object.keys(rounds))
                ? 'Final'
                : `Round ${roundNum}`
              }
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundMatches.map(renderMatch)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRoundRobinView = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Round Robin Matches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(renderMatch)}
        </div>
      </div>
    )
  }

  const renderGroupStageView = () => {
    const groups = {}
    matches.forEach(match => {
      const groupName = match.group_id || 'knockout'
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(match)
    })

    return (
      <div className="space-y-8">
        {Object.entries(groups).map(([groupName, groupMatches]) => (
          <div key={groupName} className="space-y-4">
            <h3 className="text-lg font-semibold">
              {groupName === 'knockout' ? 'Knockout Stage' : `Group ${groupName}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupMatches.map(renderMatch)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament bracket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Tournament Bracket
        </h2>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{matches.length} matches</span>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Matches Yet</h3>
            <p className="text-gray-500">Tournament bracket hasn't been generated yet.</p>
            {isOrganizer && (
              <Button className="mt-4">Generate Bracket</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        renderBracket()
      )}

      {/* Match Result Dialog */}
      <Dialog open={selectedMatch !== null} onOpenChange={() => {
        setSelectedMatch(null)
        setActiveTab('match-code')
      }}>
        <DialogContent className="max-w-md">
          {selectedMatch && (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('match-code')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'match-code'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Match Code
                </button>
                <button
                  onClick={() => setActiveTab('report-results')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'report-results'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Report Results
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'match-code' && (
                <>
                  {/* Player Names */}
                  <div className="text-center">
                    <div className="font-medium">{selectedMatch.player1?.full_name}</div>
                    <div className="font-medium">{selectedMatch.player2?.full_name}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      type="text"
                      value={resultForm.match_room_code}
                      onChange={(e) => setResultForm(prev => ({ ...prev, match_room_code: e.target.value }))}
                      placeholder="Value"
                      maxLength="20"
                      className="text-center"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMatch(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReportResult}
                      disabled={!resultForm.match_room_code?.trim() || reportingResult || !user || authLoading}
                      className="flex-1 bg-gray-700 hover:bg-gray-800"
                    >
                      {reportingResult ? 'Sending...' : 'Send Code'}
                    </Button>
                  </div>
                </>
              )}

              {activeTab === 'report-results' && (
                <>
                  {/* Player Names */}
                  <div className="text-center">
                    <div className="font-medium">{selectedMatch.player1?.full_name}</div>
                    <div className="font-medium">{selectedMatch.player2?.full_name}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Winner</Label>
                    <select
                      value={resultForm.winner_id}
                      onChange={(e) => setResultForm(prev => ({ ...prev, winner_id: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select winner</option>
                      <option value={selectedMatch.player1_id}>
                        {selectedMatch.player1?.full_name}
                      </option>
                      <option value={selectedMatch.player2_id}>
                        {selectedMatch.player2?.full_name}
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Player 1 Score</Label>
                      <Input
                        type="number"
                        value={resultForm.player1_score}
                        onChange={(e) => setResultForm(prev => ({ ...prev, player1_score: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Player 2 Score</Label>
                      <Input
                        type="number"
                        value={resultForm.player2_score}
                        onChange={(e) => setResultForm(prev => ({ ...prev, player2_score: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Screenshot <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file format
                            const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
                            if (!validTypes.includes(file.type)) {
                              alert('Please select a PNG or JPEG image file.')
                              e.target.value = ''
                              return
                            }

                            // For now, we'll store the file name as a placeholder
                            // In a real implementation, this would upload to storage
                            const fileUrl = `screenshot_${Date.now()}_${file.name}`
                            setResultForm(prev => ({ ...prev, screenshot_url: fileUrl }))
                          } else {
                            setResultForm(prev => ({ ...prev, screenshot_url: '' }))
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="screenshot-upload"
                      />
                      <div className="w-full p-3 border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50">
                        <span className="text-gray-700">
                          {resultForm.screenshot_url ?
                            `Selected: ${resultForm.screenshot_url.split('_').pop()}` :
                            'Browse... No file selected.'
                          }
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Required: Upload a screenshot in PNG or JPEG format
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={resultForm.notes}
                      onChange={(e) => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the match..."
                      rows="3"
                    />
                  </div>

                  {/* Authentication Status */}
                  {authLoading ? (
                    <div className="text-center p-2">
                      <span className="text-sm text-gray-500">Checking authentication...</span>
                    </div>
                  ) : !user ? (
                    <div className="text-center p-2 bg-red-50 border border-red-200 rounded">
                      <span className="text-sm text-red-600">
                        You must be logged in to report match results
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-600">
                        Authenticated as {user.email}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMatch(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReportResult}
                      disabled={!resultForm.winner_id || !resultForm.screenshot_url || reportingResult || !user || authLoading}
                      className="flex-1 bg-gray-700 hover:bg-gray-800"
                    >
                      {reportingResult ? 'Sending...' : 'Send Code'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
