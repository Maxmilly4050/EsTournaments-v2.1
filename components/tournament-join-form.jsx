"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard, Phone, Shield, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const MOBILE_PROVIDERS = [
  { id: "mpesa", name: "M-Pesa", logo: "📱" },
  { id: "airtel", name: "Airtel Money", logo: "📲" },
  { id: "tigo", name: "Mix by Yas (Tigo Pesa)", logo: "💳" },
]

export default function TournamentJoinForm({ tournament, user }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    mobileProvider: "",
    phoneNumber: "",
    confirmPhone: "",
  })

  const entryFeeInTsh = Math.round(tournament.entry_fee * 2500)

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+255|0)[67]\d{8}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const formatPhoneNumber = (phone) => {
    // Convert to international format
    if (phone.startsWith("0")) {
      return "+255" + phone.substring(1)
    }
    return phone
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.mobileProvider) {
        toast.error("Please select a mobile money provider")
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.phoneNumber) {
        toast.error("Please enter your phone number")
        return
      }
      if (!validatePhoneNumber(formData.phoneNumber)) {
        toast.error("Please enter a valid Tanzanian phone number (starting with 0 or +255)")
        return
      }
      if (formData.phoneNumber !== formData.confirmPhone) {
        toast.error("Phone numbers do not match")
        return
      }
      setStep(3)
    }
  }

  const handlePayment = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          provider: formData.mobileProvider,
          phoneNumber: formatPhoneNumber(formData.phoneNumber),
          amount: entryFeeInTsh,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Payment initiated! Please check your phone for the payment prompt.")
        setStep(4)

        // Poll for payment status
        pollPaymentStatus(result.paymentId)
      } else {
        toast.error(result.error || "Payment failed. Please try again.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 30 // 5 minutes
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`)
        const result = await response.json()

        if (result.status === "confirmed") {
          toast.success("Payment confirmed! Welcome to the tournament! 🎉")
          setTimeout(() => {
            router.push(`/tournaments/${tournament.id}`)
          }, 2000)
          return
        } else if (result.status === "failed") {
          toast.error("Payment failed. Please try again.")
          setStep(3)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000) // Check every 10 seconds
        } else {
          toast.error("Payment verification timed out. Please contact support.")
          setStep(3)
        }
      } catch (error) {
        console.error("Status check error:", error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000)
        }
      }
    }

    checkStatus()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Select Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.mobileProvider}
                onValueChange={(value) => handleInputChange("mobileProvider", value)}
                className="space-y-3"
              >
                {MOBILE_PROVIDERS.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <RadioGroupItem value={provider.id} id={provider.id} />
                    <Label htmlFor={provider.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">{provider.logo}</span>
                      <span className="text-white font-medium">{provider.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Entry Fee:</span>
                  <span className="text-green-400 font-bold text-xl">Tsh {entryFeeInTsh.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleNextStep}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!formData.mobileProvider}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Enter Phone Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678 or +255712345678"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-sm text-gray-400">
                  Enter your {MOBILE_PROVIDERS.find((p) => p.id === formData.mobileProvider)?.name} number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPhone" className="text-gray-300">
                  Confirm Phone Number
                </Label>
                <Input
                  id="confirmPhone"
                  type="tel"
                  placeholder="Confirm your phone number"
                  value={formData.confirmPhone}
                  onChange={(e) => handleInputChange("confirmPhone", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!formData.phoneNumber || !formData.confirmPhone}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Confirm Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tournament:</span>
                  <span className="text-white font-medium">{tournament.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Payment Method:</span>
                  <span className="text-white">
                    {MOBILE_PROVIDERS.find((p) => p.id === formData.mobileProvider)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Phone Number:</span>
                  <span className="text-white">{formData.phoneNumber}</span>
                </div>
                <div className="flex justify-between border-t border-slate-600 pt-3">
                  <span className="text-gray-300 font-medium">Total Amount:</span>
                  <span className="text-green-400 font-bold text-xl">Tsh {entryFeeInTsh.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                <p className="text-blue-300 text-sm">
                  You will receive a payment prompt on your phone. Please complete the payment to join the tournament.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button onClick={handlePayment} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Payment Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="py-8">
                <Loader2 className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Waiting for Payment Confirmation</h3>
                <p className="text-gray-300 mb-4">
                  Please complete the payment on your phone. This may take a few minutes.
                </p>
                <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">
                    Check your phone for the payment prompt from{" "}
                    {MOBILE_PROVIDERS.find((p) => p.id === formData.mobileProvider)?.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= stepNumber ? "bg-green-600 text-white" : "bg-slate-600 text-gray-400"
              }`}
            >
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-12 h-1 mx-2 ${step > stepNumber ? "bg-green-600" : "bg-slate-600"}`} />
            )}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  )
}
