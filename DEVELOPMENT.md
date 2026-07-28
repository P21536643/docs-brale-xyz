# M-Pesa Payment Hub - Development Guide

## Local Development Setup

### Prerequisites

- Node.js 18+ (use nvm for version management)
- pnpm (recommended) or npm
- PostgreSQL 14+ (or use Neon for development)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd m-pesa-payment-hub
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
Edit `.env.local` with your Neon PostgreSQL URL and M-Pesa credentials:
```env
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-random-32-char-secret
MPESA_CONSUMER_KEY=your_test_consumer_key
MPESA_CONSUMER_SECRET=your_test_consumer_secret
MPESA_SHORTCODE=your_test_shortcode
MPESA_PASSKEY=your_test_passkey
```

### Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Development Workflow

### Code Structure

- **`app/`**: Next.js app directory with pages and routes
- **`components/`**: React components
  - `auth-form.tsx`: Authentication form component
  - `payment-form.tsx`: Payment form component
  - `transaction-history.tsx`: Transaction table component
- **`lib/`**: Utility functions and configurations
  - `auth.ts`: Better Auth configuration
  - `mpesa/client.ts`: M-Pesa API client
  - `validation.ts`: Input validation utilities
  - `errors.ts`: Error handling utilities
  - `rate-limit.ts`: Rate limiting
  - `db/`: Database configuration

### Database Schema

Tables are automatically created on first run. To manually create tables:

```bash
# Via Neon console or psql
psql $DATABASE_URL < schema.sql
```

### Testing Payment Flows

1. **Sign Up**
   - Navigate to `/sign-up`
   - Fill in name, email, password
   - Click "Create account"

2. **Sign In**
   - Navigate to `/sign-in`
   - Use created credentials

3. **Make a Payment**
   - Navigate to `/dashboard`
   - Fill in phone number: `0712345678`
   - Enter amount: `1`
   - Click "Pay with M-Pesa"
   - Check your M-Pesa for prompt (if using real M-Pesa)

4. **View Transactions**
   - Transaction history displayed on dashboard
   - Status updates in real-time when payment completes

### Using M-Pesa Sandbox

1. **Get sandbox credentials** from [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. **Update environment variables** with sandbox credentials
3. **Test without real transactions** using sandbox shortcodes

### Debugging

#### Enable Debug Logging

Add console logs with the `[v0]` prefix:
```typescript
console.log('[v0] Transaction initiated:', transactionId)
```

#### Check Database Queries

Use Drizzle Studio (if available):
```bash
pnpm exec drizzle-kit studio
```

#### Monitor API Requests

1. Open DevTools (F12 in browser)
2. Go to Network tab
3. Make payment request
4. Check request/response details

### Code Style

This project uses:
- **TypeScript**: For type safety
- **ESLint**: Configured in `eslintrc.json`
- **Prettier**: For code formatting

Run linting:
```bash
pnpm lint
```

Format code:
```bash
pnpm format
```

### Making Changes

1. **Create a new branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
```bash
git add .
git commit -m "Add your feature"
```

3. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

## Adding Features

### Adding a New API Route

Create file `app/api/new-endpoint/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Your logic here
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Adding a New Server Action

Create or update `app/actions/new-action.ts`:
```typescript
'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function myNewAction(data: any) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  
  // Your logic here
}
```

### Adding a New UI Component

Create file `components/new-component.tsx`:
```typescript
'use client'

export function NewComponent() {
  return <div>Your component</div>
}
```

### Adding Database Table

1. Update `lib/db/schema.ts` with new table definition
2. Create table in Neon using SQL
3. Use Drizzle ORM to query the table

## Testing

### Unit Tests

Create test file `app/actions/__tests__/payment.test.ts`:
```typescript
import { initiatePayment } from '../payment'

describe('initiatePayment', () => {
  it('validates phone number', async () => {
    const result = await initiatePayment('invalid', 100, 'test')
    expect(result.success).toBe(false)
  })
})
```

Run tests:
```bash
pnpm test
```

### Manual Testing Checklist

- [ ] Sign-up with new email
- [ ] Sign-in with credentials
- [ ] Payment form validation
- [ ] Transaction history displays
- [ ] Error messages appear
- [ ] Rate limiting works
- [ ] Session persists across page reloads
- [ ] Responsive on mobile

## Performance Debugging

### Measure Web Vitals

```bash
pnpm exec next build
```

### Check Bundle Size

```bash
pnpm exec next build --analyze
```

### Database Query Performance

Check slow queries in Neon console.

## Common Issues

### M-Pesa API Errors

**Error**: "Invalid credentials"
- Verify `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`
- Ensure shortcode is active

**Error**: "Invalid phone number"
- Phone must be valid Kenya number
- Supports formats: 254XXXXXXXXX, 0XXXXXXXXX, 7XXXXXXXXX

### Authentication Issues

**Issue**: "Session not found"
- Clear browser cookies
- Check `BETTER_AUTH_SECRET` is set
- Verify database connection

**Issue**: "Can't find user"
- Check user exists in database
- Verify user ID in session

### Database Issues

**Error**: "Connection refused"
- Verify `DATABASE_URL` is correct
- Check internet connection
- Ensure Neon project is active

## Deployment Preview

Deploy to Vercel for testing:
```bash
git push origin feature/your-feature
```

Vercel will automatically create a preview URL.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)
- [Better Auth Docs](https://better-auth.vercel.app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [M-Pesa API Docs](https://developer.safaricom.co.ke)

## Need Help?

1. Check error logs: `pnpm dev` output
2. Review database: Neon Console
3. Test API: Use Postman or curl
4. Debug browser: DevTools Network tab

## Quick Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm lint               # Check linting
pnpm format             # Format code
pnpm type-check         # TypeScript check

# Database
pnpm db:generate        # Generate Drizzle migrations
pnpm db:migrate         # Run migrations

# Build & Deploy
pnpm build              # Build for production
pnpm start              # Start production server

# Testing
pnpm test               # Run tests
pnpm test:watch        # Watch mode
```
