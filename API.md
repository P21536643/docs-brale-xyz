# M-Pesa Payment Hub - API Documentation

## Authentication Endpoints

### POST /api/auth/sign-up
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "token": "session-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/sign-in
Sign in an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "token": "session-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/sign-out
Sign out the current user.

**Response:**
```json
{
  "ok": true
}
```

## Payment Endpoints

### POST /api/payments/initiate (Server Action)
Initiate an M-Pesa STK Push payment.

**Request Parameters:**
```typescript
initiatePayment(
  phoneNumber: string,  // "0712345678" or "+254712345678"
  amount: number,       // 1 - 70000 KES
  description: string   // Optional payment description
)
```

**Response:**
```json
{
  "success": true,
  "checkoutRequestId": "ws_CO_DMZ_...",
  "merchantRequestId": "16813-1590511...",
  "message": "Payment initiated. Check your phone for the M-Pesa prompt."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid phone number or amount"
}
```

### GET /api/payments/status
Check the status of a payment.

**Query Parameters:**
- `checkoutRequestId` (required): The checkout request ID from initiate response

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "message": "Payment successful!"
}
```

**Status Values:**
- `pending`: Payment is awaiting user action
- `completed`: Payment was successful
- `failed`: Payment failed
- `user_cancelled`: User cancelled the payment

### POST /api/payments/callback
M-Pesa callback endpoint for payment notifications.

**Request Body (from M-Pesa):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "16813-1590511...",
      "CheckoutRequestID": "ws_CO_DMZ_...",
      "ResultCode": 0,
      "ResultDesc": "The service request has been processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1000
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "LIH7QQT60SH"
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

**Response:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

## Transaction Endpoints

### GET /api/transactions (Server Action)
Get the current user's transaction history.

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "phoneNumber": "254712345678",
      "amount": "1000",
      "description": "Payment",
      "status": "completed",
      "mpesaReceiptNumber": "LIH7QQT60SH",
      "errorMessage": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

## Rate Limiting

API endpoints have the following rate limits:

- **Payment Initiation**: 10 requests per minute per user
- **Status Checks**: 20 requests per minute per user
- **General API**: 100 requests per minute per IP

When rate limited, responses will return HTTP 429 with:
```json
{
  "error": "Too many requests. Please wait before trying again."
}
```

## Error Codes

### Validation Errors (400)
- `INVALID_PHONE`: Phone number format is invalid
- `INVALID_AMOUNT`: Amount is outside allowed range (1-70000 KES)
- `MISSING_FIELD`: Required field is missing

### Authentication Errors (401)
- `SESSION_NOT_FOUND`: User session is invalid or expired
- `UNAUTHORIZED`: User is not authenticated

### M-Pesa Errors (from M-Pesa API)
- `0`: Success
- `1`: Insufficient Funds
- `17`: User cancelled the transaction
- Other codes: Refer to M-Pesa documentation

## Transaction Statuses

- `pending`: Payment request created, awaiting user action
- `initiated`: M-Pesa STK Push sent, awaiting response
- `completed`: Payment successful
- `failed`: Payment failed
- `user_cancelled`: User cancelled the payment
- `expired`: Payment request expired

## Data Models

### User
```typescript
{
  id: string                    // UUID
  name: string | null
  email: string                 // Unique
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}
```

### Transaction
```typescript
{
  id: number                    // Primary key
  userId: string                // User ID
  requestId: string             // Unique transaction ID
  phoneNumber: string           // M-Pesa phone number
  amount: string                // Amount in KES
  description: string | null
  status: string                // Payment status
  mpesaReceiptNumber: string    // M-Pesa receipt
  errorCode: string | null
  errorMessage: string | null
  initiatedAt: Date
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

## Best Practices

1. **Phone Number Format**: Accept multiple formats and normalize to international format
2. **Polling**: Check payment status every 5 seconds initially, then increase interval
3. **Error Handling**: Always handle and display user-friendly error messages
4. **Security**: Never expose M-Pesa credentials in client-side code
5. **Logging**: Log all payment transactions for audit trails
6. **Retry Logic**: Implement exponential backoff for failed API calls

## Webhooks

To receive payment notifications:

1. Configure M-Pesa callback URL in dashboard:
   ```
   https://yourdomain.com/api/payments/callback
   ```

2. Endpoint must:
   - Accept POST requests
   - Process within 5 seconds
   - Return HTTP 200 with JSON response

3. Signature verification should be implemented for production

## Testing

### Sandbox Testing
Use test credentials provided by M-Pesa to test payment flows without real transactions.

### Production Testing
Before going live:
1. Test with small amounts
2. Verify callback receipt
3. Confirm transaction history accuracy
4. Test error scenarios

## Rate Limiting Implementation

The API uses in-memory rate limiting. For production, consider:
- Redis-based rate limiting
- Per-IP rate limiting
- Per-user rate limiting
- Global rate limiting

## Support

For issues with:
- API: Check error codes and messages
- M-Pesa: Contact Safaricom developer support
- Application: Review logs and error messages
