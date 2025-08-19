import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map()

export class SecurityMiddleware {
  static async validateAdmin(request) {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return {
          isValid: false,
          error: "Authentication required",
          status: 401,
        }
      }

      // Check admin permissions
      const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []
      const isAdmin = ADMIN_USER_IDS.includes(user.id) || user.email?.endsWith("@admin.com")

      if (!isAdmin) {
        return {
          isValid: false,
          error: "Admin access required",
          status: 403,
        }
      }

      return {
        isValid: true,
        user,
      }
    } catch (error) {
      console.error("Admin validation error:", error)
      return {
        isValid: false,
        error: "Authentication failed",
        status: 500,
      }
    }
  }

  static async validateUser(request) {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return {
          isValid: false,
          error: "Authentication required",
          status: 401,
        }
      }

      return {
        isValid: true,
        user,
      }
    } catch (error) {
      console.error("User validation error:", error)
      return {
        isValid: false,
        error: "Authentication failed",
        status: 500,
      }
    }
  }

  static async checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    if (rateLimitStore.has(identifier)) {
      const requests = rateLimitStore.get(identifier).filter((time) => time > windowStart)
      rateLimitStore.set(identifier, requests)
    }

    const currentRequests = rateLimitStore.get(identifier) || []

    if (currentRequests.length >= maxRequests) {
      return {
        allowed: false,
        resetTime: Math.ceil((currentRequests[0] + windowMs - now) / 1000),
      }
    }

    // Add current request
    currentRequests.push(now)
    rateLimitStore.set(identifier, currentRequests)

    return {
      allowed: true,
      remaining: maxRequests - currentRequests.length,
    }
  }

  static async validateCSRF(request) {
    // Basic CSRF protection - check origin header
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")

    if (!origin || !host) {
      return {
        isValid: false,
        error: "Missing required headers",
      }
    }

    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // For development
      process.env.NEXT_PUBLIC_SITE_URL,
    ].filter(Boolean)

    if (!allowedOrigins.includes(origin)) {
      return {
        isValid: false,
        error: "Invalid origin",
      }
    }

    return { isValid: true }
  }

  static sanitizeInput(input) {
    if (typeof input === "string") {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim()
    }

    if (typeof input === "object" && input !== null) {
      const sanitized = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value)
      }
      return sanitized
    }

    return input
  }

  static logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: details.userAgent || "unknown",
      ip: details.ip || "unknown",
    }

    console.log("[SECURITY]", JSON.stringify(logEntry))

    // In production, send to security monitoring service
    // await sendToSecurityMonitoring(logEntry)
  }
}

export function withSecurity(handler, options = {}) {
  return async (request) => {
    try {
      const ip = request.headers.get("x-forwarded-for") || "unknown"
      const userAgent = request.headers.get("user-agent") || "unknown"

      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await SecurityMiddleware.checkRateLimit(
          ip,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs,
        )

        if (!rateLimitResult.allowed) {
          SecurityMiddleware.logSecurityEvent("RATE_LIMIT_EXCEEDED", {
            ip,
            userAgent,
            resetTime: rateLimitResult.resetTime,
          })

          return NextResponse.json(
            { error: "Too many requests" },
            {
              status: 429,
              headers: {
                "Retry-After": rateLimitResult.resetTime.toString(),
              },
            },
          )
        }
      }

      // CSRF protection
      if (options.csrfProtection && request.method !== "GET") {
        const csrfResult = await SecurityMiddleware.validateCSRF(request)
        if (!csrfResult.isValid) {
          SecurityMiddleware.logSecurityEvent("CSRF_VIOLATION", {
            ip,
            userAgent,
            origin: request.headers.get("origin"),
            host: request.headers.get("host"),
          })

          return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
        }
      }

      // Authentication
      let authResult = { isValid: true }
      if (options.requireAuth) {
        authResult = options.requireAdmin
          ? await SecurityMiddleware.validateAdmin(request)
          : await SecurityMiddleware.validateUser(request)

        if (!authResult.isValid) {
          SecurityMiddleware.logSecurityEvent("AUTH_FAILURE", {
            ip,
            userAgent,
            error: authResult.error,
          })

          return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }
      }

      // Input sanitization
      if (request.method !== "GET") {
        try {
          const body = await request.json()
          const sanitizedBody = SecurityMiddleware.sanitizeInput(body)

          // Create new request with sanitized body
          const sanitizedRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody),
          })

          // Add user to request context
          sanitizedRequest.user = authResult.user
          sanitizedRequest.ip = ip
          sanitizedRequest.userAgent = userAgent

          return await handler(sanitizedRequest)
        } catch (error) {
          return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
        }
      }

      // Add context to GET requests
      request.user = authResult.user
      request.ip = ip
      request.userAgent = userAgent

      return await handler(request)
    } catch (error) {
      console.error("Security middleware error:", error)
      SecurityMiddleware.logSecurityEvent("MIDDLEWARE_ERROR", {
        error: error.message,
        stack: error.stack,
      })

      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
