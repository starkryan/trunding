# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Montra is a Next.js 15 investment platform with TypeScript, featuring authentication, payment processing, and reward services. The app uses Better Auth for authentication with email OTP and Google OAuth, Prisma with PostgreSQL, and a comprehensive component system built with shadcn/ui.

## Development Commands

```bash
# Development
npm run dev                 # Start development server on localhost:3000
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint (ignores build errors)

# Database
npx prisma migrate dev      # Run database migrations in development
npx prisma generate         # Generate Prisma client to src/generated/prisma
npx prisma studio           # Open Prisma Studio for database inspection
npx prisma migrate reset    # Reset database (destructive)

# Authentication
npx better-auth generate    # Generate Better Auth utilities
```

## Architecture Overview

### Authentication System
- **Provider**: Better Auth with email OTP and Google OAuth
- **Configuration**: `src/lib/auth.ts` - Main auth config with Resend integration
- **Security**: Enhanced OAuth security in `src/lib/oauth-security.ts`
- **Middleware**: Route protection via `src/middleware.ts`
- **Client**: Auth client in `src/lib/auth-client.ts`
- **Context**: React context in `src/context/auth-context.ts`

### Database Architecture
- **Schema**: `prisma/schema.prisma` - Complete data model with user management, rewards, payments, and transactions
- **Client**: Generated to `src/generated/prisma` (custom output path)
- **Models**: User authentication, reward services, wallet system, payment processing
- **Hooks**: Automatic wallet creation on user signup via database hooks

### Application Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated app routes
│   │   ├── home/          # Dashboard
│   │   ├── market/        # Investment marketplace
│   │   ├── portfolio/     # User portfolio
│   │   ├── profile/       # User profile
│   │   ├── trade/         # Trading interface
│   │   └── transactions/  # Transaction history
│   ├── admin/             # Admin dashboard with full CRUD
│   ├── api/               # API routes
│   └── payment/           # Payment processing
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   └── admin/             # Admin-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Better Auth configuration
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
└── context/               # React contexts
    └── auth-context.tsx   # Authentication state management
```

### Component System
- **UI Framework**: shadcn/ui components in `src/components/ui/`
- **Configuration**: `components.json` - New York style, Lucide icons, TypeScript
- **Styling**: Tailwind CSS 4.0 with custom animations via tw-animate-css
- **State**: React Context for auth, Zustand for global state
- **Forms**: React Hook Form with Zod validation and @hookform/resolvers

### Payment System
- **Provider**: KukuPay integration (₹300-₹1,00,000 range)
- **Processing**: Webhook-based payment verification
- **Wallet**: Automatic wallet creation and transaction tracking
- **Security**: Enhanced transaction monitoring and audit trails

## Key Development Patterns

### Database Operations
- Always use the Prisma client from `src/lib/prisma.ts`
- Database schema changes require running `npx prisma migrate dev`
- Custom client generation path: `src/generated/prisma`

### Authentication Flow
- Email OTP verification required for new users
- Google OAuth with enhanced security validation
- Automatic wallet creation on user signup
- Session management via Better Auth cookies

### Route Protection
- Middleware handles optimistic route protection
- Auth routes: `/signin`, `/signup` (redirect authenticated users)
- Protected routes: `/home`, `/dashboard`, `/market`, `/portfolio`, `/profile`, `/trade`, `/wallet`
- Admin routes: `/admin/*` (requires ADMIN/SUPER_ADMIN role)

### Component Development
- Use shadcn/ui components as base
- Follow the established component structure in `src/components/`
- Import paths use `@/` alias for `src/`
- UI components in `src/components/ui/` follow shadcn patterns

## Environment Variables

Required environment variables for development:
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Email Service (Resend)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Security Considerations

- OAuth security validation implemented in `src/lib/oauth-security.ts`
- Enhanced session validation and CSRF protection
- Transaction monitoring for payment processing
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Input validation via Zod schemas
- Email verification required for account access

## Testing Notes

- Test setup uses Jest and React Testing Library
- PWA functionality testing required for mobile features
- Security testing emphasis on authentication and payment flows
- Database transactions should be tested for consistency