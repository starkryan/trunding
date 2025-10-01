# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Montra is a modern investment platform built with Next.js 15, featuring user authentication, portfolio management, and trading capabilities. The application uses Better Auth for secure authentication with OTP-based email verification and integrates with Resend for email delivery.

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Database Operations
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open database browser

### Better Auth Operations
- `npx better-auth generate` - Generate Better Auth types
- `npx better-auth migrate` - Run database migrations

### Admin Setup
- `POST /api/admin/setup-first-admin` - Setup first admin user (development only)
- Admin panel accessible at `/admin` for users with admin privileges

## Architecture Overview

### Authentication System
- **Better Auth**: Primary authentication framework with email/password and OTP plugins
- **Email Verification**: Required before accessing protected routes
- **Session Management**: Cookie-based sessions with middleware protection
- **OTP Flow**: 6-digit codes sent via Resend, 5-minute expiration, 3 attempts allowed

### Database Layer
- **Prisma**: ORM with PostgreSQL backend
- **Schema Location**: `prisma/schema.prisma`
- **Generated Client**: `src/generated/prisma/` (custom output location)
- **Models**: User, Session, Account, Verification
- **Admin Roles**: USER, ADMIN, SUPER_ADMIN with `isAdmin` boolean flag

### Route Structure
```
src/app/
├── api/                    # API routes
│   └── admin/             # Admin API endpoints
├── admin/                 # Admin panel (requires admin privileges)
│   ├── dashboard/         # Admin dashboard
│   ├── users/             # User management
│   ├── analytics/         # Platform analytics
│   ├── transactions/      # Transaction monitoring
│   ├── security/          # Security settings
│   ├── database/          # Database management
│   ├── reports/           # System reports
│   └── settings/          # Admin settings
├── dashboard/             # Protected dashboard area
├── home/                  # Main authenticated area
├── market/                # Market data and trading
├── portfolio/             # User portfolio management
├── profile/               # User profile settings
├── trade/                 # Trading interface
├── wallet/                # Wallet management
├── signin/                # Login page
├── signup/                # Registration page
└── verify-otp/            # Email verification page
```

### Middleware Protection
The middleware (`src/middleware.ts`) enforces:
- **Public Routes**: Accessible without authentication (`/`)
- **Auth Routes**: Only for unauthenticated users (`/signin`, `/signup`)
- **Protected Routes**: Require authentication and email verification
- **OTP Verification**: Special handling for email verification flow
- **Admin Routes**: Separate admin middleware (`src/middleware-admin.ts`) requires admin privileges

### Admin System
- **Admin Panel**: `/admin` routes with dedicated authentication
- **User Management**: View, search, and manage user roles and permissions
- **Analytics**: Platform statistics and user growth tracking
- **Security**: Role-based access control (USER, ADMIN, SUPER_ADMIN)
- **Setup**: Use `/api/admin/setup-first-admin` endpoint in development to create first admin

### Key Libraries
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: Zustand for client state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS 4 with CSS variables for theming
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_URL` - Base URL for auth callbacks
- `BETTER_AUTH_SECRET` - Secret for signing tokens
- `RESEND_API_KEY` - Resend API key for email delivery
- `EMAIL_FROM` - Default sender email address

## Code Standards

### TypeScript Configuration
- Strict mode enabled
- Custom path aliases: `@/` for `src/`
- Generated types in `src/generated/`

### Database Conventions
- PostgreSQL with Prisma ORM
- Custom client output location
- Better Auth adapter integration
- Audit trails for security

### Authentication Flow
1. User signs up with email/password
2. OTP sent via Resend for verification
3. Email must be verified before accessing protected areas
4. Sessions managed via HTTP-only cookies
5. Middleware enforces route protection

## Development Notes

- Better Auth schema must be kept in sync with Prisma schema
- Email verification is required for all protected routes
- OTP codes expire in 5 minutes with 3 attempt limit
- Development server runs on port 3000 by default
- Images from Unsplash domains are configured in Next.js
- ESLint is configured to ignore build errors (for development)