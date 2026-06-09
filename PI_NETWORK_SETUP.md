# Pi Exchange - Pi Network Authentication Setup

## Overview

The Pi Exchange platform now supports **Pi Network authentication** alongside Freighter wallet connection. Users can choose to authenticate with their Pi Network account or use a Stellar Freighter wallet.

## Features

### Pi Network Authentication
- ✅ One-click authentication using the Pi Network SDK
- ✅ Access to user profile (username, name, phone, avatar)
- ✅ Secure token-based sessions
- ✅ Auto-reconnection on page reload
- ✅ Integration with Stellar blockchain transactions

### Freighter Wallet Connection
- ✅ Stellar blockchain integration
- ✅ Direct wallet control
- ✅ Real-time balance updates
- ✅ Asset swaps on Stellar DEX

## How It Works

### Authentication Flow

#### Pi Network Auth
1. User clicks "Connect with Pi" button
2. Pi Network SDK initializes and requests authentication
3. User authorizes the app in Pi Network
4. User profile and access token are stored locally
5. Dashboard displays user's Pi Network username

#### Freighter Auth
1. User clicks "Connect Freighter" button
2. Freighter wallet extension is requested for approval
3. User's Stellar public key is retrieved
4. Account balances are loaded from Horizon API
5. Dashboard displays Stellar account information

### Session Management

**Pi Network Sessions:**
- Stored in `localStorage` under `pi_auth`
- Includes user profile, username, and access token
- Auto-expires after 24 hours
- Can be manually cleared on logout

**Freighter Sessions:**
- Stored in `localStorage` under `stellar_public_key`
- Contains only the public key (private key stays in Freighter)
- Persists until user disconnects
- Can be manually cleared on logout

## File Structure

```
lib/
├── pi-network.ts          # Pi Network SDK integration
├── wallet-context.tsx     # Wallet authentication context
├── stellar.ts             # Stellar blockchain integration
└── blockchain-transactions.ts

app/
├── layout.tsx             # Includes Pi Network SDK script
└── page.tsx              # Authentication page with both options

components/
└── dashboard.tsx          # Shows authenticated user info
```

## Key Functions

### Pi Network Integration (`lib/pi-network.ts`)

```typescript
// Check if Pi Network SDK is available
isPiNetworkAvailable(): boolean

// Initialize Pi Network SDK
initPiNetwork(): Promise<boolean>

// Authenticate with Pi Network
authenticateWithPi(): Promise<PiAuthResult>

// Get user's Pi wallet address
getPiWalletAddress(): Promise<string | null>

// Create a payment on Pi Network
createPiPayment(amount, memo, metadata?): Promise<Payment>

// Check if user is authenticated
isAuthenticatedWithPi(): boolean

// Get stored Pi auth
getStoredPiAuth(): PiAuthResult | null

// Logout from Pi Network
logoutFromPi(): void
```

### Wallet Context (`lib/wallet-context.tsx`)

The `WalletProvider` now supports both auth methods:

```typescript
interface WalletContextType {
  publicKey: string | null           // Freighter public key
  balances: Record<string, string>  // Account balances
  isConnected: boolean               // Connection status
  isLoading: boolean                 // Loading state
  piUser: PiUser | null              // Pi user profile
  authMethod: "pi" | "freighter" | null  // Current auth method
  connect: (method: "pi" | "freighter") => Promise<void>
  disconnect: () => void
  refreshBalances: () => Promise<void>
}
```

## Configuration

### Pi Network SDK

The Pi Network SDK is loaded from the CDN in `app/layout.tsx`:

```html
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
```

If you're in the **sandbox mode**, replace with:
```html
<script src="https://sdk.minepi.com/pi-sdk-sandbox.js"></script>
```

For **production**, use the standard mainnet SDK.

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Pi Exchange - Auth Screen                   │
└─────────────────────────────────────────────────────────┘
                    ↓ User selects
          ┌─────────┴──────────┐
          ↓                    ↓
   ┌─────────────┐      ┌──────────────┐
   │ Pi Network  │      │   Freighter  │
   │  ("pi")     │      │ ("freighter")│
   └──────┬──────┘      └────────┬─────┘
          ↓                      ↓
   ┌──────────────┐      ┌──────────────────┐
   │ Pi SDK Auth  │      │ Freighter Prompt │
   └──────┬───────┘      └────────┬─────────┘
          ↓                       ↓
   ┌──────────────┐      ┌──────────────────┐
   │Store piAuth  │      │ Store pubKey     │
   │ + Profile    │      │ + Load Balances  │
   └──────┬───────┘      └────────┬─────────┘
          │                       │
          └───────────┬───────────┘
                      ↓
          ┌────────────────────────┐
          │  Dashboard (Connected) │
          └────────────────────────┘
```

## Usage Examples

### Using Pi Network Auth in Components

```typescript
import { useWallet } from "@/lib/wallet-context"

export function MyComponent() {
  const { piUser, authMethod, connect } = useWallet()

  if (authMethod === "pi" && piUser) {
    return <div>Welcome, {piUser.username}!</div>
  }

  return (
    <button onClick={() => connect("pi")}>
      Connect with Pi
    </button>
  )
}
```

### Creating Payments

```typescript
import { createPiPayment } from "@/lib/pi-network"

async function sendPayment() {
  try {
    const payment = await createPiPayment(
      10,                    // amount
      "Trading fee",         // memo
      { txId: "12345" }     // metadata
    )
    console.log("Payment created:", payment)
  } catch (error) {
    console.error("Payment failed:", error)
  }
}
```

## Deployment Notes

### Environment Setup

1. **Pi Network App Registration**: Register your app with Pi Network Core team
2. **SDK Version**: Use production SDK from `https://sdk.minepi.com/pi-sdk.js`
3. **CORS**: Ensure your domain is whitelisted in Pi Network settings

### Testing

For testing Pi Network authentication:
1. Install Pi Network app on your phone
2. Open the Testnet mode in app settings
3. Test authentication flow
4. Verify user data is stored correctly

### Production Checklist

- [ ] Pi Network app is registered and approved
- [ ] Using production SDK URL
- [ ] CORS settings configured correctly
- [ ] Error handling for SDK failures
- [ ] Session expiration logic working
- [ ] Local storage cleanup on logout
- [ ] Freighter wallet alternative available

## Troubleshooting

### "Pi Network SDK not available"
- Ensure the SDK script is loaded (check browser console)
- Check if Pi Network is running in your environment
- Verify CDN is accessible from your domain

### Pi Auth fails silently
- Check browser console for errors
- Ensure Pi Network app has correct permissions
- Verify localStorage is enabled

### Auto-reconnect not working
- Clear localStorage and try again
- Check if session expired (24 hour limit)
- Verify Pi Network app is still authorized

## Future Enhancements

- [ ] Multi-wallet support (MetaMask, WalletConnect)
- [ ] Integrate Pi payments into swap/trading
- [ ] Direct Stellar to Pi Network bridges
- [ ] Transaction history sync across networks
- [ ] Mobile app integration

## Support

For issues with:
- **Pi Network SDK**: https://developers.minepi.com
- **Stellar Blockchain**: https://developers.stellar.org
- **Freighter Wallet**: https://freighter.app
