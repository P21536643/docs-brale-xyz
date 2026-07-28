# IsioloCoin Wallet Integration

This document outlines the complete wallet integration with isiolo-coin-link.base44.app and M-Pesa payment system.

## Overview

The wallet integration allows users to:
- Connect their IsioloCoin wallet address
- View real-time balance and transaction history
- Convert IsioloCoin to Kenyan Shillings via M-Pesa
- Receive mining rewards directly to their wallet
- Track all conversions and payments

## Architecture

### Database Schema

#### `coin_link_wallets`
Stores connected wallet addresses for each user.

```sql
CREATE TABLE coin_link_wallets (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  walletAddress TEXT NOT NULL UNIQUE,
  publicKey TEXT,
  status TEXT DEFAULT 'active',
  verifiedAt TIMESTAMP,
  lastSyncedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### `wallet_balances`
Caches wallet balance information (synced every 60 seconds).

```sql
CREATE TABLE wallet_balances (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  walletAddress TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  unconfirmedBalance NUMERIC DEFAULT 0,
  totalReceived NUMERIC DEFAULT 0,
  totalSent NUMERIC DEFAULT 0,
  lastUpdated TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### `wallet_transactions`
Stores transaction history from wallet.

```sql
CREATE TABLE wallet_transactions (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL,
  transactionHash TEXT,
  type TEXT NOT NULL,
  fromAddress TEXT,
  toAddress TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  syncedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### API Client (`lib/wallet/coin-link-client.ts`)

Core client for communicating with coin-link API:

**Methods:**
- `getWalletBalance(address)` - Fetch current balance with 60-second caching
- `getWalletTransactions(address, limit)` - Get transaction history
- `validateWalletAddress(address)` - Validate address format
- `transferToWallet(from, to, amount)` - Transfer coins
- `getTransactionStatus(hash)` - Check transaction status
- `clearCache()` - Clear all cached data
- `clearWalletCache(address)` - Clear specific wallet cache

**Caching Strategy:**
- Balance data cached for 60 seconds
- Transaction data cached for 60 seconds
- Cache automatically invalidated on transfers
- Fallback to cached data if API unavailable

### Server Actions (`app/actions/wallet.ts`)

**Available Actions:**
- `linkWalletAddress(walletAddress)` - Link new wallet to user account
- `getWalletInfo()` - Get wallet balance and info
- `getWalletTransactionHistory(limit)` - Get transaction history
- `unlinkWallet()` - Unlink wallet from account (rate limited to 3/hour)

**Security Features:**
- User authentication required on all actions
- Per-user data isolation
- Wallet address validation
- Rate limiting on unlink operations
- Error logging without sensitive data exposure

### Frontend Components

#### `wallet-display.tsx`
Main wallet display showing:
- Current balance (confirmed and unconfirmed)
- Total received/sent statistics
- Action buttons (view transactions, convert, unlink)
- Empty state when no wallet connected

#### `wallet-connect-form.tsx`
Form for connecting wallet address:
- Wallet address input with validation
- Instructions on finding wallet address
- Benefits callout
- Error messaging

#### `wallet-convert-form.tsx`
Convert IsioloCoin to M-Pesa:
- Real-time KES calculation (1 ISIO = 50 KES)
- Phone number input with validation
- Balance display
- Max button for quick selection
- Integration with M-Pesa payment system

#### `wallet-transactions.tsx`
Display transaction history:
- Sortable transaction table
- Transaction hash, direction, amounts
- Status indicators (confirmed, pending, failed)
- Formatted dates and addresses
- Pagination support

### Routes

#### `/wallet`
Main wallet dashboard showing connected wallet info and balance.

#### `/wallet/connect`
Connect new wallet address with instructions.

#### `/wallet/convert`
Convert IsioloCoin balance to M-Pesa with real-time calculation.

#### `/wallet/transactions`
View full transaction history for connected wallet.

## Integration with Mining

When mining rewards are processed, they are automatically:
1. Calculated in IsioloCoin
2. Queued for transfer to user's connected wallet
3. Tracked in `wallet_transactions` table
4. Reflected in balance update

## Integration with M-Pesa

The wallet conversion flow:
1. User selects amount to convert
2. Frontend calculates KES amount (1 ISIO = 50 KES)
3. User provides M-Pesa phone number
4. System initiates M-Pesa STK push
5. User confirms payment with PIN
6. Transaction recorded in both systems
7. Balance updated on confirmation

## Conversion Rate

**Current Rate:** 1 IsioloCoin (ISIO) = 50 KES

To update the rate, modify the `ISIO_TO_KES` constant in:
- `components/wallet-convert-form.tsx`
- `lib/wallet/coin-link-client.ts` (if needed)

## Security Considerations

1. **Wallet Address Validation**
   - Format validation using regex
   - API-side verification through coin-link

2. **Data Isolation**
   - Each user can only access their own wallet
   - Query filtering by userId on all operations

3. **Rate Limiting**
   - Unlink wallet: 3 attempts per hour
   - Conversion: Inherits from M-Pesa system

4. **API Communication**
   - HTTPS-only to coin-link API
   - Wallet address never sent to M-Pesa
   - Sensitive operations logged securely

5. **Cache Management**
   - Automatic cache invalidation on changes
   - 60-second cache prevents overloading coin-link
   - Stale data displays with "lastUpdated" timestamp

## Error Handling

**Common Errors:**

1. **Invalid Wallet Address**
   - User receives: "Invalid wallet address format"
   - Action: Validate address with coin-link before linking

2. **Wallet Already Linked**
   - User receives: "This wallet is already linked to another account"
   - Action: Prevent multiple users from using same wallet

3. **Insufficient Balance**
   - User receives: "Insufficient balance"
   - Action: Verify balance before allowing conversion

4. **API Unavailable**
   - System: Falls back to cached balance data
   - User sees: Last known balance with "last updated" timestamp

## Monitoring & Debugging

**Check wallet sync:**
```sql
SELECT * FROM coin_link_wallets 
WHERE userId = 'user_id' 
ORDER BY updatedAt DESC;
```

**View balance cache:**
```sql
SELECT * FROM wallet_balances 
WHERE userId = 'user_id';
```

**Check transaction history:**
```sql
SELECT * FROM wallet_transactions 
WHERE userId = 'user_id' 
ORDER BY createdAt DESC 
LIMIT 20;
```

## Future Enhancements

1. **Automatic Mining Rewards Transfer**
   - Auto-transfer mining rewards to wallet
   - Scheduled sync every 6 hours

2. **Multi-Wallet Support**
   - Allow users to link multiple wallets
   - Switch between wallets easily

3. **Advanced Analytics**
   - Wallet performance dashboard
   - Charts for balance trends
   - Income/expense analysis

4. **Direct Wallet-to-Wallet Transfers**
   - Send coins to other users
   - Recipient verification

5. **Webhook Notifications**
   - Real-time balance updates
   - Transaction confirmations
   - Large balance changes alert

## Troubleshooting

**Q: Wallet balance not updating**
A: Check `lastSyncedAt` in wallet_balances. If older than 60 seconds, manual refresh needed.

**Q: "Invalid wallet address" error**
A: Verify address format on isiolo-coin-link.base44.app. Address should be 26-35 characters.

**Q: M-Pesa conversion fails**
A: Check M-Pesa payment action logs and ensure phone number has correct format (+254XXXXXXXXX).

**Q: Wallet transactions not showing**
A: Verify wallet has transactions on coin-link. First sync may take a few seconds.

## API Response Examples

### Get Wallet Balance
```json
{
  "address": "isiolo1abc123def456...",
  "balance": 150.25,
  "unconfirmedBalance": 5.00,
  "totalReceived": 500.00,
  "totalSent": 344.75,
  "txCount": 42
}
```

### Get Transactions
```json
[
  {
    "hash": "tx123abc...",
    "from": "isiolo1abc...",
    "to": "isiolo1def...",
    "amount": 10.5,
    "timestamp": 1720000000,
    "status": "confirmed",
    "blockNumber": 12345
  }
]
```

## Contact & Support

For issues with:
- **Wallet connectivity**: Check isiolo-coin-link.base44.app status
- **M-Pesa integration**: See DEPLOYMENT.md
- **General bugs**: Create an issue in project repository
