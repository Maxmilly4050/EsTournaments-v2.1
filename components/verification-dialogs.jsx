"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, Phone, Loader2, AlertCircle } from "lucide-react"

export function EmailVerificationDialog({ isOpen, onClose, currentEmail, isEmailChange = false }) {
  const [step, setStep] = useState("send") // 'send' or 'verify'
  const [email, setEmail] = useState(isEmailChange ? "" : currentEmail || "")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationToken, setVerificationToken] = useState("")

  const { toast } = useToast()

  const handleSendVerification = async () => {
    console.log("[v0] Starting email verification process", { email, isEmailChange })

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = isEmailChange ? "/api/profile/email-change" : "/api/verification/email/send"
      const body = isEmailChange ? { newEmail: email } : { email }

      console.log("[v0] Making API call to:", endpoint, "with body:", body)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      console.log("[v0] API response status:", response.status)

      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!response.ok) {
        console.log("[v0] API error:", data.error)
        throw new Error(data.error)
      }

      // Store token for testing (remove in production)
      setVerificationToken(data.token)
      setStep("verify")

      toast({
        title: isEmailChange ? "Email change initiated" : "Verification sent",
        description: isEmailChange
          ? "Check your new email for the verification link. Your current email remains active until verified."
          : "Check your email for the verification link",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please enter the verification token",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = isEmailChange ? "/api/profile/email-change/confirm" : "/api/verification/email/verify"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: isEmailChange ? "Email changed successfully" : "Email verified",
        description: isEmailChange
          ? `Your email has been changed to ${data.newEmail}`
          : "Your email has been verified successfully",
      })

      onClose()
      // Refresh the page to update verification status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("send")
    setToken("")
    setVerificationToken("")
    setEmail(isEmailChange ? "" : currentEmail || "")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            {isEmailChange ? "Change Email Address" : "Email Verification"}
          </DialogTitle>
        </DialogHeader>

        {step === "send" && (
          <div className="space-y-4">
            {isEmailChange && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-300 text-sm">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Your current email ({currentEmail}) will remain active until you verify the new email address.</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white">
                {isEmailChange ? "New Email Address" : "Email Address"}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder={isEmailChange ? "Enter your new email address" : "Enter your email address"}
                disabled={!isEmailChange && !!currentEmail}
              />
              {isEmailChange && (
                <p className="text-sm text-gray-400 mt-1">This must be different from your current email address</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose} className="border-slate-600 text-gray-300 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSendVerification} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEmailChange ? "Send Change Request" : "Send Verification"}
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
              <p className="text-blue-300 text-sm">
                A verification email has been sent to <strong>{email}</strong>
                {isEmailChange && (
                  <>
                    <br />
                    <span className="text-yellow-300">
                      Your current email ({currentEmail}) remains active until verification is complete.
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Testing helper - remove in production */}
            {verificationToken && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded">
                <p className="text-yellow-300 text-sm">
                  <strong>For testing:</strong> {verificationToken}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="token" className="text-white">
                Verification Token
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter verification token from email"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep("send")} className="border-slate-600 text-gray-300">
                Back
              </Button>
              <Button onClick={handleVerifyEmail} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEmailChange ? "Confirm Change" : "Verify Email"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function PhoneVerificationDialog({ isOpen, onClose }) {
  const [step, setStep] = useState("send") // 'send' or 'verify'
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [testOtp, setTestOtp] = useState("")

  const { toast } = useToast()

  const handleSendVerification = async () => {
    console.log("[v0] Starting phone verification process", { phoneNumber })

    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = "/api/verification/phone/send"
      const body = { phoneNumber }

      console.log("[v0] Making API call to:", endpoint, "with body:", body)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      console.log("[v0] API response status:", response.status)

      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!response.ok) {
        console.log("[v0] API error:", data.error)
        throw new Error(data.error)
      }

      // Store OTP for testing (remove in production)
      setTestOtp(data.otp)
      setStep("verify")

      toast({
        title: "Verification sent",
        description: "Check your phone for the verification code",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!otpCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = "/api/verification/phone/verify"
      const body = { otpCode }

      console.log("[v0] Making API call to:", endpoint, "with body:", body)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      console.log("[v0] API response status:", response.status)

      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!response.ok) {
        console.log("[v0] API error:", data.error)
        throw new Error(data.error)
      }

      toast({
        title: "Phone verified",
        description: "Your phone number has been verified successfully",
      })

      onClose()
      // Refresh the page to update verification status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("send")
    setOtpCode("")
    setTestOtp("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Phone Verification
          </DialogTitle>
        </DialogHeader>

        {step === "send" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="+1 (555) 123-4567"
              />
              <p className="text-sm text-gray-400 mt-1">Include country code (e.g., +1 for US)</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose} className="border-slate-600 text-gray-300 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSendVerification} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Code
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
              <p className="text-blue-300 text-sm">
                A verification code has been sent to <strong>{phoneNumber}</strong>
              </p>
            </div>

            {/* Testing helper - remove in production */}
            {testOtp && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded">
                <p className="text-yellow-300 text-sm">
                  <strong>For testing:</strong> {testOtp}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="otp" className="text-white">
                Verification Code
              </Label>
              <Input
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-center text-lg tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
              <p className="text-sm text-gray-400 mt-1">Enter the 6-digit code sent to your phone</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep("send")} className="border-slate-600 text-gray-300">
                Back
              </Button>
              <Button onClick={handleVerifyPhone} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify Phone
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
