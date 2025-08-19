// Input validation schemas for profile management
export const profileValidationSchemas = {
  // Basic profile fields
  displayName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_.]+$/,
    sanitize: (value) => value?.trim().replace(/\s+/g, " "),
  },

  gamerTag: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    sanitize: (value) => value?.trim().toLowerCase(),
    reserved: ["admin", "moderator", "system", "support", "official"],
  },

  bio: {
    maxLength: 500,
    sanitize: (value) => value?.trim(),
    forbiddenWords: ["spam", "hack", "cheat", "bot"],
  },

  country: {
    pattern: /^[a-z]{2}$/,
    allowedValues: ["us", "ca", "uk", "de", "fr", "jp", "kr", "br", "au", "other"],
  },

  // Game IDs
  konamiUsername: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    sanitize: (value) => value?.trim(),
  },

  eaId: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    sanitize: (value) => value?.trim(),
  },

  // Contact information
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
    sanitize: (value) => value?.trim().toLowerCase(),
  },

  phoneNumber: {
    pattern: /^\+?[\d\s\-$$$$]{10,}$/,
    sanitize: (value) => value?.replace(/\s/g, ""),
  },

  // Social links
  socialLinks: {
    twitch: {
      pattern: /^https:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]+$/,
      sanitize: (value) => value?.trim(),
    },
    youtube: {
      pattern: /^https:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_]+$/,
      sanitize: (value) => value?.trim(),
    },
    discord: {
      pattern: /^[a-zA-Z0-9_]+#\d{4}$/,
      sanitize: (value) => value?.trim(),
    },
  },

  // Admin fields
  banReason: {
    minLength: 10,
    maxLength: 500,
    sanitize: (value) => value?.trim(),
  },
}

export function validateField(fieldName, value, schema = profileValidationSchemas[fieldName]) {
  if (!schema) {
    return { isValid: true, sanitizedValue: value }
  }

  // Sanitize input
  let sanitizedValue = value
  if (schema.sanitize && typeof schema.sanitize === "function") {
    sanitizedValue = schema.sanitize(value)
  }

  // Check if empty and required
  if (!sanitizedValue && schema.required) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
      sanitizedValue: null,
    }
  }

  // Skip validation if empty and not required
  if (!sanitizedValue) {
    return { isValid: true, sanitizedValue: null }
  }

  // Length validation
  if (schema.minLength && sanitizedValue.length < schema.minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${schema.minLength} characters`,
      sanitizedValue,
    }
  }

  if (schema.maxLength && sanitizedValue.length > schema.maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${schema.maxLength} characters`,
      sanitizedValue,
    }
  }

  // Pattern validation
  if (schema.pattern && !schema.pattern.test(sanitizedValue)) {
    return {
      isValid: false,
      error: `${fieldName} format is invalid`,
      sanitizedValue,
    }
  }

  // Allowed values validation
  if (schema.allowedValues && !schema.allowedValues.includes(sanitizedValue)) {
    return {
      isValid: false,
      error: `${fieldName} must be one of: ${schema.allowedValues.join(", ")}`,
      sanitizedValue,
    }
  }

  // Reserved words validation
  if (schema.reserved && schema.reserved.includes(sanitizedValue.toLowerCase())) {
    return {
      isValid: false,
      error: `${fieldName} contains a reserved word`,
      sanitizedValue,
    }
  }

  // Forbidden words validation
  if (schema.forbiddenWords) {
    const lowerValue = sanitizedValue.toLowerCase()
    const foundForbidden = schema.forbiddenWords.find((word) => lowerValue.includes(word.toLowerCase()))
    if (foundForbidden) {
      return {
        isValid: false,
        error: `${fieldName} contains inappropriate content`,
        sanitizedValue,
      }
    }
  }

  return { isValid: true, sanitizedValue }
}

export function validateProfileUpdate(updates) {
  const errors = {}
  const sanitizedUpdates = {}

  for (const [fieldName, value] of Object.entries(updates)) {
    // Handle nested objects like social_links
    if (fieldName === "social_links" && typeof value === "object") {
      const socialErrors = {}
      const sanitizedSocial = {}

      for (const [platform, url] of Object.entries(value)) {
        const schema = profileValidationSchemas.socialLinks[platform]
        const validation = validateField(`${platform} URL`, url, schema)

        if (!validation.isValid) {
          socialErrors[platform] = validation.error
        } else {
          sanitizedSocial[platform] = validation.sanitizedValue
        }
      }

      if (Object.keys(socialErrors).length > 0) {
        errors.social_links = socialErrors
      } else {
        sanitizedUpdates.social_links = sanitizedSocial
      }
    } else {
      const validation = validateField(fieldName, value)

      if (!validation.isValid) {
        errors[fieldName] = validation.error
      } else {
        sanitizedUpdates[fieldName] = validation.sanitizedValue
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: sanitizedUpdates,
  }
}
