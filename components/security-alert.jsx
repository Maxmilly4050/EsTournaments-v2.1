"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, X } from "lucide-react"

export function SecurityAlert({ type = "info", message, onDismiss, autoHide = false }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoHide, onDismiss])

  if (!visible) return null

  const getAlertStyles = () => {
    switch (type) {
      case "error":
        return "border-red-600 bg-red-900/20 text-red-300"
      case "warning":
        return "border-yellow-600 bg-yellow-900/20 text-yellow-300"
      case "success":
        return "border-green-600 bg-green-900/20 text-green-300"
      default:
        return "border-blue-600 bg-blue-900/20 text-blue-300"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "error":
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  return (
    <Alert className={`${getAlertStyles()} relative`}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <AlertDescription className="flex-1">{message}</AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setVisible(false)
            onDismiss?.()
          }}
          className="h-auto p-1 text-current hover:bg-current/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  )
}

export function SecurityStatus({ verificationStatus, profileSecurity }) {
  const getSecurityScore = () => {
    let score = 0
    if (verificationStatus?.emailVerified) score += 25
    if (verificationStatus?.phoneVerified) score += 25
    if (profileSecurity?.strongPassword) score += 25
    if (profileSecurity?.twoFactorEnabled) score += 25
    return score
  }

  const securityScore = getSecurityScore()

  const getScoreColor = () => {
    if (securityScore >= 75) return "text-green-400"
    if (securityScore >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  const getRecommendations = () => {
    const recommendations = []

    if (!verificationStatus?.emailVerified) {
      recommendations.push("Verify your email address")
    }
    if (!verificationStatus?.phoneVerified) {
      recommendations.push("Add and verify a phone number")
    }
    if (!profileSecurity?.strongPassword) {
      recommendations.push("Use a stronger password")
    }
    if (!profileSecurity?.twoFactorEnabled) {
      recommendations.push("Enable two-factor authentication")
    }

    return recommendations
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Account Security
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Security Score:</span>
          <span className={`font-bold ${getScoreColor()}`}>{securityScore}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Email Verified</span>
          {verificationStatus?.emailVerified ? (
            <span className="text-green-400">✓</span>
          ) : (
            <span className="text-red-400">✗</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Phone Verified</span>
          {verificationStatus?.phoneVerified ? (
            <span className="text-green-400">✓</span>
          ) : (
            <span className="text-red-400">✗</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Strong Password</span>
          {profileSecurity?.strongPassword ? (
            <span className="text-green-400">✓</span>
          ) : (
            <span className="text-red-400">✗</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Two-Factor Auth</span>
          {profileSecurity?.twoFactorEnabled ? (
            <span className="text-green-400">✓</span>
          ) : (
            <span className="text-red-400">✗</span>
          )}
        </div>
      </div>

      {getRecommendations().length > 0 && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
          <h4 className="text-yellow-300 font-medium mb-2">Security Recommendations:</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            {getRecommendations().map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
