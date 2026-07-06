# M-Pesa Payment Hub

A complete, production-ready web application for processing M-Pesa payments with user authentication, payment tracking, and real-time status updates.

![M-Pesa Payment Hub](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)

## Features

✨ **Complete M-Pesa Integration**
- STK Push payment initiation
- Real-time payment status tracking
- Automatic callback handling
- Transaction history with detailed records

🔐 **Secure Authentication**
- Email/password registration and login
- Session-based authentication
- Protected payment routes
- Secure cookie handling

💳 **Payment Management**
- Phone number validation
- Amount validation (1-70,000 KES)
- Rate limiting (10 requests/minute)
- Comprehensive error handling

📊 **Transaction Tracking**
- Full payment history
- Status filtering
- Receipt tracking
- Error logging

🎨 **Professional UI**
- Responsive design (mobile, tablet, desktop)
- Card-based layouts
- Real-time status updates
- User-friendly error messages

⚡ **Production Ready**
- Type-safe with TypeScript
- Scalable architecture
- Comprehensive error handling
- Security best practices

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ (or Neon account)
- M-Pesa Production Credentials

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd m-pesa-payment-hub

# 2. Install dependencies
pnpm install

# 3. Set environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app.

## Environment Variables

```env
# Required: Database
DATABASE_URL=postgresql://user:pass@host/db

# Required: Authentication Secret
BETTER_AUTH_SECRET=your-random-32-char-secret

# Required: M-Pesa Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

Generate `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Usage

### 1. Create Account
```
1. Navigate to /sign-up
2. Enter name, email, password
3. Click "Create Account"
```

### 2. Make Payment
```
1. Sign in to your account
2. Go to /dashboard
3. Enter phone number (e.g., 0712345678)
4. Enter amount (1-70,000 KES)
5. Click "Pay with M-Pesa"
6. Complete M-Pesa prompt on your phone
```

### 3. View Transactions
```
1. Dashboard shows all your transactions
2. Real-time status updates
3. Receipt numbers for successful payments
4. Error details for failed payments
```

## Architecture

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with hooks
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: High-quality UI components

### Backend
- **Next.js API Routes**: Serverless functions
- **Server Actions**: Direct database access
- **Better Auth**: Authentication framework

### Database
- **Neon PostgreSQL**: Serverless database
- **Drizzle ORM**: Type-safe query builder

### Payments
- **M-Pesa API**: Safaricom payment gateway
- **Online Query**: Real-time status checking
- **STK Push**: In-app payment prompts

## Project Structure

```
app/
├── api/
│   ├── auth/[...all]/route.ts    # Authentication
│   └── payments/                  # Payment endpoints
├── actions/payment.ts             # Server actions
├── dashboard/page.tsx             # Payment dashboard
├── sign-in/page.tsx              # Login page
└── sign-up/page.tsx              # Registration page

lib/
├── auth.ts                       # Auth config
├── mpesa/client.ts               # M-Pesa client
├── db/                           # Database
├── validation.ts                 # Input validation
├── errors.ts                     # Error handling
└── rate-limit.ts                 # Rate limiting

components/
├── auth-form.tsx                 # Auth form
├── payment-form.tsx              # Payment form
├── transaction-history.tsx       # Transaction table
└── ui/                           # UI components
```

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register user
- `POST /api/auth/sign-in` - Sign in user
- `POST /api/auth/sign-out` - Sign out

### Payments
- `POST /api/payments/initiate` (Server Action) - Start payment
- `GET /api/payments/status` - Check status
- `POST /api/payments/callback` - M-Pesa webhook

## Documentation

- **[API Documentation](./API.md)** - Complete API reference
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Development Guide](./DEVELOPMENT.md)** - Local development setup
- **[Project Summary](./PROJECT_SUMMARY.md)** - Complete overview

## Security

- ✅ Input validation for all payments
- ✅ Rate limiting (10 req/min per user)
- ✅ Secure session management
- ✅ SQL injection prevention
- ✅ CSRF protection
- ✅ Error logging without exposing secrets

## Performance

- ✅ Server-side rendering for SEO
- ✅ Efficient database queries
- ✅ Token caching (M-Pesa OAuth)
- ✅ Connection pooling
- ✅ Responsive images

## Testing

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect repository to Vercel
# 3. Add environment variables
# 4. Deploy automatically
```

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Support

### Troubleshooting

**M-Pesa API Error**: Check credentials in `.env.local`

**Database Connection Failed**: Verify `DATABASE_URL` and IP whitelisting

**Authentication Issues**: Clear cookies and re-login

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Better Auth Docs](https://better-auth.vercel.app)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [M-Pesa API Docs](https://developer.safaricom.co.ke)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Refund processing
- [ ] Multiple payment methods
- [ ] Admin dashboard
- [ ] Payment analytics
- [ ] Mobile app (React Native)
- [ ] Webhook retries
- [ ] Payment scheduling
- [ ] Batch payments

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Payments by [M-Pesa/Safaricom](https://www.safaricom.co.ke)
- Database by [Neon](https://neon.tech)
- UI from [shadcn/ui](https://ui.shadcn.com)

## Contact

For questions or support, please open an issue on GitHub.

---

**Ready for production.** Deploy with confidence.
