# M-Pesa Payment Hub - Deployment Guide

## Overview

This is a fully functional M-Pesa payment integration application built with:
- **Frontend**: Next.js 16 with React 19
- **Backend**: Next.js API Routes with Server Actions
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Payments**: M-Pesa STK Push and Online Query
- **UI**: shadcn/ui components with Tailwind CSS

## Prerequisites

Before deploying, ensure you have:

1. **Neon PostgreSQL Account**: [neon.tech](https://neon.tech)
2. **Vercel Account**: [vercel.com](https://vercel.com)
3. **M-Pesa Production Credentials**:
   - Consumer Key
   - Consumer Secret
   - Business Shortcode
   - Passkey

## Environment Variables

Create a `.env.production` file or set these in Vercel Settings:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
BETTER_AUTH_SECRET=your-random-32-char-secret

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# Optional: Customize auth URL (auto-configured if not set)
BETTER_AUTH_URL=https://yourdomain.com
```

### Generate BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

## Deployment Steps

### 1. Vercel Deployment

```bash
# Clone or connect your GitHub repository to Vercel

# In Vercel Dashboard:
1. Click "New Project"
2. Select your GitHub repository
3. Configure environment variables:
   - Add all variables from .env.production
4. Click "Deploy"
```

### 2. Database Setup

The database schema is automatically created when the application first runs. The tables include:

- `user` - User accounts
- `session` - Session management
- `account` - Authentication provider accounts
- `verification` - Email verification tokens
- `transactions` - M-Pesa payment records
- `payment_callbacks` - M-Pesa callback events

To manually initialize the database, connect to Neon and run:

```sql
-- Better Auth tables (automatically created)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables are created similarly
```

### 3. M-Pesa Configuration

1. **Sandbox Testing** (Optional):
   - Use M-Pesa test credentials
   - Test payment flow before production

2. **Production Setup**:
   - Update `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`
   - Update `MPESA_SHORTCODE` and `MPESA_PASSKEY`
   - Ensure callback URL is correctly configured

3. **Callback URL**:
   - Ensure M-Pesa is configured to send callbacks to:
     ```
     https://yourdomain.com/api/payments/callback
     ```

## Security Considerations

1. **HTTPS Only**: All M-Pesa communications must use HTTPS
2. **Rate Limiting**: API routes have built-in rate limiting
3. **Input Validation**: All user inputs are validated before processing
4. **SQL Injection Prevention**: Using Drizzle ORM with parameterized queries
5. **Authentication**: Session-based with secure cookies
6. **CSRF Protection**: Built into Better Auth

## Monitoring & Logging

### Server Logs
- Check Vercel's Function Logs for errors
- Review application logs for payment processing issues

### Database Monitoring
- Use Neon Console to monitor queries
- Set up alerts for unusual activity

### Payment Monitoring
- Monitor `transactions` table for failed payments
- Review `payment_callbacks` for M-Pesa responses
- Check error codes and messages

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Check if IP is whitelisted in Neon (if applicable)
- Ensure connection pool isn't exhausted

### M-Pesa API Errors
- Verify credentials are correct
- Check if account has sufficient permissions
- Ensure shortcode is active in M-Pesa

### Authentication Issues
- Verify BETTER_AUTH_SECRET is set
- Check session cookies are not blocked
- Ensure BETTER_AUTH_URL matches deployment domain

### Payment Status Not Updating
- Check callback URL is reachable
- Verify firewall allows M-Pesa IP addresses
- Review API error logs for details

## Scaling Considerations

For production deployments with high traffic:

1. **Database**: Use Neon's connection pooling
2. **Caching**: Implement Redis for session caching
3. **Rate Limiting**: Replace in-memory rate limiting with Redis
4. **Monitoring**: Set up comprehensive logging and alerts
5. **Testing**: Load test payment endpoints

## Backup & Recovery

1. **Database Backups**: Neon provides automated backups
2. **Point-in-Time Recovery**: Available through Neon Console
3. **Transaction History**: Exported from `transactions` table

## Support & Documentation

- [Next.js Documentation](https://nextjs.org)
- [Neon Documentation](https://neon.tech/docs)
- [Better Auth Documentation](https://better-auth.vercel.app)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke)

## Post-Deployment Checklist

- [ ] Database connection verified
- [ ] All environment variables set
- [ ] SSL certificate installed
- [ ] M-Pesa callback URL configured
- [ ] Monitoring and logging enabled
- [ ] Rate limiting tested
- [ ] Payment flow tested end-to-end
- [ ] Error handling verified
- [ ] Backup strategy confirmed
- [ ] Documentation reviewed
