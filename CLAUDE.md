# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Montra is a Next.js 15 investment platform with TypeScript, featuring comprehensive authentication, payment processing, reward services, and referral systems. The app uses Better Auth for authentication with email OTP and Google OAuth, Prisma with PostgreSQL, and a modern component system built with shadcn/ui.

## Development Commands

```bash
# Development
npm run dev                 # Start development server on localhost:3000
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint (ignores build errors during builds)

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
- **Context**: React context in `src/context/auth-context.tsx`

### Database Architecture
- **Schema**: `prisma/schema.prisma` - Complete data model with user management, rewards, payments, referrals, and transactions
- **Client**: Generated to `src/generated/prisma` (custom output path)
- **Models**: User authentication, reward services, wallet system, payment processing, referral system, withdrawal management
- **Naming**: Strict camelCase conventions (userId, createdAt, updatedAt)
- **Hooks**: Automatic wallet creation on user signup via database relationships

### Application Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated app routes
│   │   ├── home/          # Dashboard
│   │   ├── market/        # Investment marketplace
│   │   ├── portfolio/     # User portfolio
│   │   ├── profile/       # User profile
│   │   ├── transactions/  # Transaction history
│   │   ├── withdrawal/    # Withdrawal management
│   │   └── referral/      # Referral system
│   ├── admin/             # Admin dashboard with full CRUD
│   ├── api/               # API routes
│   ├── payment/           # Payment processing
│   ├── signin/            # Sign-in page
│   └── signup/            # Sign-up page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── admin/             # Admin-specific components
│   └── payment/           # Payment components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Better Auth configuration
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Utility functions
│   └── oauth-security.ts  # Enhanced OAuth security
├── context/               # React contexts
│   └── auth-context.tsx   # Authentication state management
├── hooks/                 # Custom React hooks
└── generated/             # Generated Prisma client
    └── prisma/
```

### Component System
- **UI Framework**: shadcn/ui components in `src/components/ui/`
- **Configuration**: `components.json` - New York style, Lucide icons, TypeScript
- **Styling**: Tailwind CSS 4.0 with custom animations via tw-animate-css
- **State**: React Context for auth, Zustand for global state
- **Forms**: React Hook Form with Zod validation and @hookform/resolvers

### Payment & Rewards System
- **Payment Provider**: KukuPay integration (₹300-₹1,00,000 range)
- **Processing**: Webhook-based payment verification
- **Wallet**: Automatic wallet creation and transaction tracking
- **Rewards**: Dynamic reward calculation system with multiple service types
- **Referral**: Multi-level referral system with configurable rewards
- **Withdrawal**: Bank account and UPI withdrawal methods
- **Security**: Enhanced transaction monitoring and audit trails

### PWA Features
- **Service Worker**: Offline functionality with caching strategies
- **Caching**: API cache (NetworkFirst), static resources (StaleWhileRevalidate), images (CacheFirst)
- **Manifest**: Progressive Web App configuration
- **Development**: PWA disabled in development, enabled in production

## Key Development Patterns

### Database Operations
- Always use the Prisma client from `src/lib/prisma.ts`
- Database schema changes require running `npx prisma migrate dev`
- Custom client generation path: `src/generated/prisma`
- Follow camelCase naming conventions for all database fields
- Use database transactions for financial operations

### Authentication Flow
- Email OTP verification required for new users
- Google OAuth with enhanced security validation (PKCE, state parameters, nonce)
- Automatic wallet creation on user signup
- Session management via Better Auth cookies (7-day sessions, 24-hour update cycles)
- Role-based access control: USER, ADMIN, SUPER_ADMIN

### Route Protection
- Middleware handles optimistic route protection
- Auth routes: `/signin`, `/signup` (redirect authenticated users away)
- Protected routes: `/home`, `/market`, `/portfolio`, `/profile`, `/transactions`, `/withdrawal`, `/referral`
- Admin routes: `/admin/*` (requires ADMIN/SUPER_ADMIN role)
- Payment routes: `/payment/*` for payment processing

### Component Development
- Use shadcn/ui components as base
- Follow the established component structure in `src/components/`
- Import paths use `@/` alias for `src/`
- UI components in `src/components/ui/` follow shadcn patterns
- Use TypeScript strict mode - no 'any' types allowed

### Financial Operations
- All payment processing uses KukuPay integration
- Wallet system automatically tracks all transactions
- Reward calculations are handled by the RewardService system
- Withdrawal requests support bank accounts and UPI
- Referral system with configurable rewards and multi-level support

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

# Payment Gateway (KukuPay)
KUKUPAY_API_KEY="your-kukupay-api-key"
KUKUPAY_SECRET="your-kukupay-secret"
```

## Security Considerations

- OAuth security validation with PKCE, state parameters, and nonce for replay protection
- Enhanced session validation and CSRF protection built into Better Auth
- Transaction monitoring for payment processing with comprehensive audit trails
- Role-based access control (USER, ADMIN, SUPER_ADMIN) with middleware protection
- Input validation via Zod schemas for all forms and API endpoints
- Email verification required for account access
- suspicious activity detection for OAuth flows
- All financial transactions logged with complete audit trails

## PWA Configuration

- Service worker configured with caching strategies for different content types
- API routes cached with NetworkFirst strategy (24-hour expiration)
- Static resources cached with StaleWhileRevalidate (30-day expiration)
- Images cached with CacheFirst strategy (30-day expiration)
- PWA features disabled in development, enabled in production
- Offline support with graceful degradation

## Code Quality Standards

- **TypeScript**: Strict mode enabled, 100% type coverage required
- **ESLint**: Next.js core-web-vitals preset, build errors ignored during development
- **Path Aliases**: `@/` alias configured for `src/` directory imports
- **Component Structure**: Consistent TypeScript interfaces and prop typing
- **Database Schema**: All models include proper relationships, constraints, and indexes

## MCP Tools Available

Claude Code has access to the following MCP tools for enhanced functionality:

- **sequential-thinking**: Dynamic problem-solving through structured thought processes
- **shadcn-ui**: Access to shadcn/ui v4 components, blocks, and examples for React development
- **desktop-commander**: File system operations, terminal commands, and process management
- **exa**: Real-time web search and content retrieval using Exa AI
- **upstash-context-7**: Context management and storage via Upstash
- **chrome-devtools**: Browser automation, testing, and performance analysis
- **ide**: VS Code integration for diagnostics and code execution

### Using MCP Tools

When working on complex problems, Claude can leverage these tools to:
- Analyze code structure and patterns
- Search for solutions and documentation
- Automate file operations and terminal commands
- Test web applications and analyze performance
- Manage context and information storage

Example usage:
- "Use sequential-thinking to break down this complex feature"
- "Search the web for solutions to this TypeScript error"
- "Use desktop-commander to run tests and analyze results"
- "Test the payment flow with chrome-devtools"