"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { validateProfileUpdate } from "@/lib/validation-schemas"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { EmailVerificationDialog, PhoneVerificationDialog } from "@/components/verification-dialogs"
import { useToast } from "@/hooks/use-toast"
import { SecurityAlert, SecurityStatus } from "@/components/security-alert"
import {
  Lock,
  Save,
  ArrowLeft,
  Upload,
  Mail,
  Phone,
  Globe,
  User,
  Shield,
  Calendar,
  DollarSign,
  Trophy,
  AlertCircle,
  Check,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    display_name: "",
    gamer_tag: "",
    bio: "",
    country: "",
    social_links: {
      twitch: "",
      youtube: "",
      discord: "",
    },
    notification_settings: {
      email_notifications: true,
      match_notifications: true,
      tournament_notifications: true,
    },
    privacy_settings: {
      profile_visibility: "public",
      match_visibility: "public",
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canChangeGamerTag, setCanChangeGamerTag] = useState(true)
  const [gamerTagCooldown, setGamerTagCooldown] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    phoneVerified: false,
    hasPhoneNumber: false,
  })
  const [securityAlert, setSecurityAlert] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [profileSecurity, setProfileSecurity] = useState({
    strongPassword: false,
    twoFactorEnabled: false,
  })
  const [pendingEmailChange, setPendingEmailChange] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        // Fetch user profile with all new fields
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile(profileData)
          setFormData({
            display_name: profileData.display_name || profileData.full_name || "",
            gamer_tag: profileData.gamer_tag || "",
            bio: profileData.bio || "",
            country: profileData.country || "",
            social_links: profileData.social_links || {
              twitch: "",
              youtube: "",
              discord: "",
            },
            notification_settings: profileData.notification_settings || {
              email_notifications: true,
              match_notifications: true,
              tournament_notifications: true,
            },
            privacy_settings: profileData.privacy_settings || {
              profile_visibility: "public",
              match_visibility: "public",
            },
          })

          setVerificationStatus({
            emailVerified: profileData.email_verified || false,
            phoneVerified: profileData.phone_verified || false,
            hasPhoneNumber: !!profileData.phone_number,
          })

          // Check gamer tag cooldown
          if (profileData.last_gamer_tag_change) {
            const lastChange = new Date(profileData.last_gamer_tag_change)
            const thirtyDaysLater = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000)
            const now = new Date()

            if (now < thirtyDaysLater) {
              setCanChangeGamerTag(false)
              setGamerTagCooldown(thirtyDaysLater)
            }
          }

          setPendingEmailChange(profileData.pending_email)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router, toast])

  const handleInputChange = (field, value) => {
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setValidationErrors({})
    setSecurityAlert(null)

    try {
      const validation = validateProfileUpdate(formData)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setSecurityAlert({
          type: "error",
          message: "Please fix the validation errors below",
        })
        setSaving(false)
        return
      }

      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // CSRF protection
        },
        body: JSON.stringify({
          updates: validation.sanitizedData,
          reason: "User profile update",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setValidationErrors(result.details)
        }
        throw new Error(result.error || "Failed to update profile")
      }

      setSecurityAlert({
        type: "success",
        message: "Profile updated successfully",
      })

      // Refresh profile data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error updating profile:", error)
      setSecurityAlert({
        type: "error",
        message: error.message || "Failed to update profile",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] Avatar upload started:", file.name, file.size, file.type)

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, and GIF files are allowed.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 2MB.",
        variant: "destructive",
      })
      return
    }

    setAvatarUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      console.log("[v0] Uploading avatar to API...")

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("[v0] Avatar upload response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload avatar")
      }

      // Update the user state to reflect the new avatar
      setUser((prev) => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          avatar_url: result.avatar_url,
        },
      }))

      // Update profile state
      setProfile((prev) => ({
        ...prev,
        avatar_url: result.avatar_url,
      }))

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAvatarUploading(false)
      // Reset the file input
      event.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-800 rounded-lg"></div>
              <div className="h-96 bg-slate-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Security Alert */}
          {securityAlert && (
            <SecurityAlert
              type={securityAlert.type}
              message={securityAlert.message}
              onDismiss={() => setSecurityAlert(null)}
              autoHide={securityAlert.type === "success"}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="border-slate-600 text-gray-300 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Editable Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="border-slate-600 text-gray-300 bg-transparent"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                        disabled={avatarUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {avatarUploading ? "Uploading..." : "Change Avatar"}
                      </Button>
                      <p className="text-sm text-gray-400 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  {/* Display Name with validation */}
                  <div>
                    <Label htmlFor="display_name" className="text-white">
                      Display Name
                    </Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange("display_name", e.target.value)}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        validationErrors.display_name ? "border-red-500" : ""
                      }`}
                      placeholder="Enter your display name"
                    />
                    {validationErrors.display_name && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.display_name}</p>
                    )}
                  </div>

                  {/* Gamer Tag with validation */}
                  <div>
                    <Label htmlFor="gamer_tag" className="text-white flex items-center">
                      Gamer Tag
                      {!canChangeGamerTag && (
                        <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          30-day cooldown
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="gamer_tag"
                      value={formData.gamer_tag}
                      onChange={(e) => handleInputChange("gamer_tag", e.target.value)}
                      disabled={!canChangeGamerTag}
                      className={`bg-slate-700 border-slate-600 text-white disabled:opacity-50 ${
                        validationErrors.gamer_tag ? "border-red-500" : ""
                      }`}
                      placeholder="Enter your gamer tag"
                    />
                    {validationErrors.gamer_tag && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.gamer_tag}</p>
                    )}
                    {!canChangeGamerTag && gamerTagCooldown && (
                      <p className="text-sm text-yellow-400 mt-1">
                        You can change your gamer tag again on {gamerTagCooldown.toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Bio with validation */}
                  <div>
                    <Label htmlFor="bio" className="text-white">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        validationErrors.bio ? "border-red-500" : ""
                      }`}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    {validationErrors.bio && <p className="text-red-400 text-sm mt-1">{validationErrors.bio}</p>}
                  </div>

                  {/* Country with validation */}
                  <div>
                    <Label htmlFor="country" className="text-white">
                      Country/Region
                    </Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="kr">South Korea</SelectItem>
                        <SelectItem value="br">Brazil</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.country && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.country}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label className="text-white flex items-center">
                      Email Address
                      {verificationStatus.emailVerified ? (
                        <Badge className="ml-2 bg-green-600 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </Label>

                    {pendingEmailChange && (
                      <div className="mb-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                        <p className="text-yellow-300 text-sm">
                          <strong>Pending email change:</strong> {pendingEmailChange}
                          <br />
                          <span className="text-gray-400">Check your new email to complete the change</span>
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                      />
                      <Button
                        variant="outline"
                        className="border-slate-600 text-gray-300 bg-transparent"
                        onClick={() => setEmailDialogOpen(true)}
                      >
                        {verificationStatus.emailVerified ? "Change" : "Verify"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Email changes require verification</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-white flex items-center">
                      Phone Number
                      {verificationStatus.phoneVerified ? (
                        <Badge className="ml-2 bg-green-600 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {verificationStatus.hasPhoneNumber ? "Unverified" : "Not Set"}
                        </Badge>
                      )}
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        value={profile?.phone_number || ""}
                        disabled
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        placeholder="Not set"
                      />
                      <Button
                        variant="outline"
                        className="border-slate-600 text-gray-300 bg-transparent"
                        onClick={() => setPhoneDialogOpen(true)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {verificationStatus.hasPhoneNumber ? "Verify" : "Add"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Social & Streaming Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="twitch" className="text-white">
                      Twitch
                    </Label>
                    <Input
                      id="twitch"
                      value={formData.social_links.twitch}
                      onChange={(e) => handleNestedChange("social_links", "twitch", e.target.value)}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        validationErrors.social_links?.twitch ? "border-red-500" : ""
                      }`}
                      placeholder="https://twitch.tv/username"
                    />
                    {validationErrors.social_links?.twitch && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.social_links.twitch}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="youtube" className="text-white">
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      value={formData.social_links.youtube}
                      onChange={(e) => handleNestedChange("social_links", "youtube", e.target.value)}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        validationErrors.social_links?.youtube ? "border-red-500" : ""
                      }`}
                      placeholder="https://youtube.com/@username"
                    />
                    {validationErrors.social_links?.youtube && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.social_links.youtube}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="discord" className="text-white">
                      Discord
                    </Label>
                    <Input
                      id="discord"
                      value={formData.social_links.discord}
                      onChange={(e) => handleNestedChange("social_links", "discord", e.target.value)}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        validationErrors.social_links?.discord ? "border-red-500" : ""
                      }`}
                      placeholder="username#1234"
                    />
                    {validationErrors.social_links?.discord && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.social_links.discord}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Notifications */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Privacy Settings */}
                  <div>
                    <h4 className="text-white font-medium mb-3">Privacy Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white">Profile Visibility</Label>
                        <Select
                          value={formData.privacy_settings.profile_visibility}
                          onValueChange={(value) => handleNestedChange("privacy_settings", "profile_visibility", value)}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="public">Public - Anyone can view</SelectItem>
                            <SelectItem value="friends">Friends Only</SelectItem>
                            <SelectItem value="private">Private - Only me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Match History Visibility</Label>
                        <Select
                          value={formData.privacy_settings.match_visibility}
                          onValueChange={(value) => handleNestedChange("privacy_settings", "match_visibility", value)}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="friends">Friends Only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  {/* Notification Settings */}
                  <div>
                    <h4 className="text-white font-medium mb-3">Notification Preferences</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Email Notifications</Label>
                        <Switch
                          checked={formData.notification_settings.email_notifications}
                          onCheckedChange={(checked) =>
                            handleNestedChange("notification_settings", "email_notifications", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Match Notifications</Label>
                        <Switch
                          checked={formData.notification_settings.match_notifications}
                          onCheckedChange={(checked) =>
                            handleNestedChange("notification_settings", "match_notifications", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Tournament Notifications</Label>
                        <Switch
                          checked={formData.notification_settings.tournament_notifications}
                          onCheckedChange={(checked) =>
                            handleNestedChange("notification_settings", "tournament_notifications", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Security Status */}
            <div className="space-y-6">
              {/* Security Status */}
              <SecurityStatus verificationStatus={verificationStatus} profileSecurity={profileSecurity} />

              {/* Account Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Account Information
                    <Badge variant="outline" className="ml-2 text-gray-400 border-gray-400">
                      Read Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      User ID
                    </Label>
                    <Input
                      value={user?.id || ""}
                      disabled
                      className="bg-slate-700 border-slate-600 text-gray-400 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Konami Username
                    </Label>
                    <Input
                      value={profile?.konami_username || "Not linked"}
                      disabled
                      className="bg-slate-700 border-slate-600 text-gray-400 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact admin to change</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      EA Sports ID
                    </Label>
                    <Input
                      value={profile?.ea_id || "Not linked"}
                      disabled
                      className="bg-slate-700 border-slate-600 text-gray-400 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact admin to change</p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Statistics
                    <Badge variant="outline" className="ml-2 text-gray-400 border-gray-400">
                      Auto-calculated
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Global Ranking
                    </Label>
                    <Input
                      value={`#${profile?.global_ranking || 0}`}
                      disabled
                      className="bg-slate-700 border-slate-600 text-gray-400 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Account Status
                    </Label>
                    <div className="flex space-x-2">
                      {profile?.is_verified && <Badge className="bg-green-600 text-white">Verified</Badge>}
                      {profile?.is_banned && <Badge className="bg-red-600 text-white">Banned</Badge>}
                      {profile?.can_host_tournaments && (
                        <Badge className="bg-blue-600 text-white">Tournament Host</Badge>
                      )}
                      {!profile?.is_verified && !profile?.is_banned && (
                        <Badge variant="outline" className="text-gray-400 border-gray-400">
                          Standard
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Wallet
                    <Badge variant="outline" className="ml-2 text-gray-400 border-gray-400">
                      Read Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-gray-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Balance
                    </Label>
                    <Input
                      value={`$${profile?.wallet_balance || "0.00"}`}
                      disabled
                      className="bg-slate-700 border-slate-600 text-gray-400 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Managed by payment system</p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Dates */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Account History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Member Since</Label>
                    <p className="text-white">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Last Updated</Label>
                    <p className="text-white">
                      {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <EmailVerificationDialog
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        currentEmail={user?.email}
        isEmailChange={verificationStatus.emailVerified}
      />

      <PhoneVerificationDialog isOpen={phoneDialogOpen} onClose={() => setPhoneDialogOpen(false)} />
    </div>
  )
}
