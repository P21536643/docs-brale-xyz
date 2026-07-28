/**
 * Validation utilities for M-Pesa payment application
 */

export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Check if it's a valid Kenya phone number
  // Should be 12 digits starting with 254 or 10 digits starting with 0 or 7
  const isValid =
    (cleaned.startsWith('254') && cleaned.length === 12) ||
    (cleaned.startsWith('7') && cleaned.length === 10) ||
    (cleaned.startsWith('0') && cleaned.length === 10)

  return isValid
}

export function validateAmount(amount: number): boolean {
  // M-Pesa transaction limits
  const MIN_AMOUNT = 1
  const MAX_AMOUNT = 70000

  return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  // Minimum 8 characters
  return password.length >= 8
}

export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')

  // Convert to international format (254XXXXXXXXX)
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1)
  } else if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned
  }

  return cleaned
}

export const ValidationErrors = {
  INVALID_PHONE: 'Invalid phone number. Use format: 0712345678 or +254712345678',
  INVALID_AMOUNT: 'Amount must be between KES 1 and KES 70,000',
  INVALID_EMAIL: 'Invalid email address',
  WEAK_PASSWORD: 'Password must be at least 8 characters',
  MISSING_NAME: 'Name is required',
  MISSING_EMAIL: 'Email is required',
  MISSING_PASSWORD: 'Password is required',
}
