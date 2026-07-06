import crypto from 'crypto'

interface TokenResponse {
  access_token: string
  expires_in: number
}

interface STKPushRequest {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: string
  Amount: string
  PartyA: string
  PartyB: string
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

interface STKPushResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
}

interface OnlineQueryRequest {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  CheckoutRequestID: string
}

interface OnlineQueryResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode?: string
  ResultDesc?: string
}

class MPesaClient {
  private consumerKey: string
  private consumerSecret: string
  private shortcode: string
  private passkey: string
  private baseUrl = 'https://api.safaricom.co.ke'
  private tokenCache: { token?: string; expiresAt?: number } = {}

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || ''
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || ''
    this.shortcode = process.env.MPESA_SHORTCODE || ''
    this.passkey = process.env.MPESA_PASSKEY || ''

    if (!this.consumerKey || !this.consumerSecret || !this.shortcode || !this.passkey) {
      throw new Error('M-Pesa credentials not configured')
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check cache first
    if (this.tokenCache.token && this.tokenCache.expiresAt && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')

    try {
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`)
      }

      const data: TokenResponse = await response.json()

      // Cache token
      this.tokenCache.token = data.access_token
      this.tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000 // Cache for expires_in - 60s

      return data.access_token
    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error)
      throw error
    }
  }

  private generateTimestamp(): string {
    const now = new Date()
    return now.toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  }

  private generatePassword(timestamp: string): string {
    const text = this.shortcode + this.passkey + timestamp
    return Buffer.from(text).toString('base64')
  }

  async initiateStkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string,
    callbackUrl: string,
  ): Promise<STKPushResponse> {
    try {
      const token = await this.getAccessToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(timestamp)

      const payload: STKPushRequest = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount.toString(),
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`STK Push failed: ${response.statusText}`)
      }

      const data: STKPushResponse = await response.json()
      return data
    } catch (error) {
      console.error('Failed to initiate STK Push:', error)
      throw error
    }
  }

  async queryOnlineStatus(
    checkoutRequestId: string,
  ): Promise<OnlineQueryResponse> {
    try {
      const token = await this.getAccessToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(timestamp)

      const payload: OnlineQueryRequest = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Online query failed: ${response.statusText}`)
      }

      const data: OnlineQueryResponse = await response.json()
      return data
    } catch (error) {
      console.error('Failed to query payment status:', error)
      throw error
    }
  }

  verifyCallback(callbackBody: string): boolean {
    // For production, implement proper signature verification
    // This is a placeholder for basic verification
    try {
      JSON.parse(callbackBody)
      return true
    } catch {
      return false
    }
  }
}

export const mpesaClient = new MPesaClient()
