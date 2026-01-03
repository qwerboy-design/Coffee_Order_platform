# Developer Guide for Coffee Order Platform

## Project Overview

**Project Name**: Coffee Order Platform (咖啡豆訂單系統)  
**Purpose**: Automated coffee bean ordering e-commerce platform with integrated workflow automation  
**Language**: TypeScript  
**Framework**: Next.js 14 (App Router)  
**Deployment**: Vercel (Hong Kong region: hkg1)

## Technology Stack

### Core Framework
- **Next.js 14** with App Router (not Pages Router)
- **React 18.3** with Server Components
- **TypeScript 5.3** (strict mode enabled)

### UI & Styling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Dark mode support enabled (media-based)

### State Management & Forms
- **Zustand** for client-side state (shopping cart)
- **React Hook Form** + **Zod** for form validation
- Client components must use `'use client'` directive

### Backend & Data
- **Airtable** as database (not Supabase - see SUPABASE_MIGRATION_RISK_ASSESSMENT.md)
- **N8N** for workflow automation
- **Resend** for email service
- **jose** for JWT session management

### Key Libraries
- `airtable` - Database client
- `axios` - HTTP client
- `date-fns` - Date formatting
- `recharts` - Charts for admin dashboard

## Project Structure

### Directory Layout
```
app/
├── (admin)/          # Admin pages with route grouping
│   ├── orders/       # Order management
│   └── products/     # Product management
├── (customer)/       # Customer-facing pages
│   ├── cart/
│   ├── checkout/
│   ├── login/
│   ├── register/
│   └── order/[id]/
└── api/              # API routes
    ├── auth/         # Authentication endpoints
    ├── orders/       # Order CRUD
    └── products/     # Product CRUD

components/
├── admin/            # Admin-specific components
├── customer/         # Customer-facing components
├── auth/             # Auth components (OTP, etc.)
└── shared/           # Shared components (Header, Footer)

lib/
├── airtable/         # Airtable client & models
├── auth/             # Auth utilities (session, OTP)
├── email/            # Email service (Resend)
├── n8n/              # N8N webhook integration
├── utils/            # Utility functions
├── validation/       # Zod schemas
├── config.ts         # Environment config
├── errors.ts         # Error handling
└── rate-limit.ts     # Rate limiting

types/                # TypeScript type definitions
hooks/                # React hooks (useCart, etc.)
```

### Route Groups
- Use `(customer)` and `(admin)` for layout grouping without affecting URLs
- Each route group has its own `layout.tsx`

## Important Files

### Configuration Files
- `next.config.js` - Next.js config with Airtable image domains, webpack watch options for Windows
- `tsconfig.json` - TypeScript config with path aliases (`@/*`)
- `tailwind.config.ts` - Tailwind with dark mode support
- `middleware.ts` - Route protection and session validation
- `vercel.json` - Vercel deployment config (Hong Kong region)

### Core Library Files
- `lib/config.ts` - Type-safe environment variable validation with Zod
- `lib/errors.ts` - Standardized error handling and response formatting
- `lib/auth/session.ts` - JWT session management with jose
- `lib/airtable/client.ts` - Airtable base connection and table names
- `lib/rate-limit.ts` - In-memory rate limiting (use Redis/Vercel KV in production)

### Documentation
- `README.md` - Project overview and quick start
- `SETUP.md` - Detailed setup guide for Airtable, N8N, webhooks
- `DATABASE.md` - Complete Airtable schema documentation
- `TEST_ORDER.md` - Order functionality testing guide
- `SUPABASE_MIGRATION_RISK_ASSESSMENT.md` - Why not to migrate to Supabase

## Development Best Practices

### Environment Variables
- Use `lib/config.ts` for type-safe env var access
- Required vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `JWT_SECRET` (32+ chars)
- Optional vars: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `NEXT_PUBLIC_APP_URL`
- Build-time placeholders prevent build failures when vars are missing

### Authentication & Sessions
- Use JWT tokens stored in httpOnly cookies (7-day expiration)
- Session cookie name: `session`
- Use `getSession()` for reading, `createSession()` for creating, `deleteSession()` for logout
- Use `requireSession()` in API routes to enforce authentication
- OTP-based login system (6-digit codes, expires after 10 minutes)

### API Routes
- Follow REST conventions: GET, POST, PUT/PATCH, DELETE
- Use standardized response format from `lib/errors.ts`:
  - Success: `{ success: true, data: T, message?: string }`
  - Error: `{ success: false, error: string, code?: AuthErrorCode }`
- Always validate input with Zod schemas from `lib/validation/schemas.ts`
- Implement rate limiting using `lib/rate-limit.ts`
- Handle errors consistently with `createErrorResponse()` and `createSuccessResponse()`

### Data Validation
- All schemas defined in `lib/validation/schemas.ts`
- Use Zod for runtime validation
- Common schemas: `registerSchema`, `loginEmailSchema`, `verifyOTPSchema`, `createOrderSchema`

### Error Handling
- Use `AuthError` class for auth-related errors
- Use `AuthErrorCode` enum for standardized error codes
- Return appropriate HTTP status codes (400, 401, 409, 429, 500)
- Log errors with `console.error()` before returning response

### Rate Limiting
- Currently in-memory (use Redis/Vercel KV for production)
- Types: `IP_OTP_REQUEST`, `EMAIL_OTP_REQUEST`, `IP_OTP_VERIFY`
- Always check rate limits before expensive operations (OTP sending, verification)
- Return 429 status when rate limit exceeded

### Airtable Integration
- Table names defined in `lib/airtable/client.ts` as constants
- Tables: `Products`, `Orders`, `Order Items`, `Customers`, `Order Status Log`, `OTP Tokens`
- Always use formula fields for computed values in Airtable
- Handle linked records carefully (see SETUP.md for details)
- Check DATABASE.md for complete field mappings

### Client Components
- Always add `'use client'` directive at the top
- Use Zustand for global state (cart management)
- Use React Hook Form for form handling
- Keep components small and focused

### Server Components
- Default in Next.js 14 App Router
- Can't use hooks or browser APIs
- Good for data fetching and static content
- Use `async` functions for data fetching

### Styling
- Use Tailwind utility classes
- Color scheme: Amber tones for coffee theme (amber-600, amber-800)
- Responsive design: mobile-first with container mx-auto
- Dark mode: Use `dark:` prefix for dark mode styles

### Type Safety
- Define types in `types/` directory
- Use TypeScript strict mode
- Avoid `any` type - use proper types or `unknown`
- Export types from where they're defined

## Common Patterns

### Creating an API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { someSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, AuthErrorCode } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = someSchema.parse(body);
    
    // Your logic here
    
    return NextResponse.json(
      createSuccessResponse({ /* data */ }, 'Success message')
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(AuthErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse(AuthErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
```

### Protected API Route
```typescript
import { requireSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(); // Throws if not authenticated
    // Your logic with session.userId, session.email
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    // Handle other errors
  }
}
```

### Using Cart Hook
```typescript
'use client';
import { useCart } from '@/hooks/useCart';

function MyComponent() {
  const { items, addItem, removeItem, getTotal, clearCart } = useCart();
  
  const handleAdd = () => {
    addItem(product, quantity, grind_option);
  };
  
  return <div>Total: ${getTotal()}</div>;
}
```

### Airtable Query Example
```typescript
import base, { TABLES } from '@/lib/airtable/client';

// Find records
const records = await base(TABLES.PRODUCTS)
  .select({
    filterByFormula: `{is_active} = TRUE()`,
    sort: [{ field: 'name', direction: 'asc' }]
  })
  .firstPage();

// Create record
const record = await base(TABLES.CUSTOMERS).create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '0912345678'
});
```

## Middleware & Route Protection

### Middleware Configuration
- File: `middleware.ts`
- Protected routes: `/profile`, `/orders`, `/settings`
- Auth routes (redirect if logged in): `/login`, `/register`
- Excludes: API routes, static files, images

### Adding Protected Routes
1. Add route pattern to `protectedRoutes` array in `middleware.ts`
2. Middleware automatically redirects unauthenticated users to `/login`
3. Original URL saved in `redirect` query param for post-login redirect

## Testing

### Manual Testing
- See TEST_ORDER.md for order flow testing procedures
- Test OTP flow: register → receive email → verify code → login
- Test rate limiting by making rapid requests

### Running the Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Building for Production
```bash
npm run build
npm start
```

## Common Issues & Solutions

### Airtable Connection Issues
- Check `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are set
- Verify API key has correct permissions in Airtable
- Check table names match exactly (case-sensitive)

### Build Failures
- Missing environment variables: Check `lib/config.ts` for placeholders
- Type errors: Run `npm run lint` to check for issues
- Import path errors: Use `@/` alias, not relative paths

### Session Issues
- JWT_SECRET must be at least 32 characters
- Check cookie settings (httpOnly, secure, sameSite)
- Verify middleware is running (check `middleware.ts` matcher)

### Rate Limiting
- In-memory store resets on server restart (development)
- For production, migrate to Redis or Vercel KV
- Clear rate limit by restarting dev server

### Windows Development
- webpack watch options configured for Windows in `next.config.js`
- Ignores Windows system directories (AppData, Temp, Windows)
- Uses polling mode to avoid file system watcher issues

## Deployment

### Vercel Deployment
- Push to GitHub repository
- Connect to Vercel
- Add environment variables in Vercel dashboard
- Deploy automatically on push
- Region: Hong Kong (hkg1) for optimal performance

### Environment Variables to Set
```
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
JWT_SECRET=your_32_char_secret
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
N8N_WEBHOOK_SECRET=your_secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## N8N Workflow Integration

### Webhook Setup
- File: `lib/n8n/webhook.ts`
- Triggers on order creation, status updates
- Sends notifications via LINE, Email, SMS
- See SETUP.md for complete N8N workflow configuration

### Order Notification Flow
1. Order created via API → saved to Airtable
2. API calls N8N webhook with order data
3. N8N processes automation (notifications, inventory updates)
4. Customer receives confirmation email/LINE message

## Code Quality

### Linting
- ESLint configured with `next/core-web-vitals`
- Run: `npm run lint`

### Code Style
- Use 2-space indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in multi-line objects/arrays

### Comments
- Add JSDoc comments for public functions
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes

## Resources

### External Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Resend API](https://resend.com/docs)
- [Zod Documentation](https://zod.dev)
- [Zustand Guide](https://zustand-demo.pmnd.rs)

### Project Documentation
- `README.md` - Quick start guide
- `SETUP.md` - Detailed setup instructions
- `DATABASE.md` - Airtable schema reference
- `TEST_ORDER.md` - Testing procedures

## Debug Artifacts

### Agent Logs in Code
- Some files contain `#region agent log` blocks (e.g., `lib/airtable/client.ts`)
- These are debug artifacts from previous development sessions
- Safe to remove if needed, but don't break functionality
- They send logs to local debug server on port 7244

## Language Notes

- UI is in Traditional Chinese (zh-TW)
- Code comments mix English and Chinese
- Error messages in Chinese for end users
- Technical documentation primarily in Chinese
- Type definitions and function names in English

## Next Steps for New Developers

1. Read README.md and SETUP.md thoroughly
2. Set up local environment with `.env.local`
3. Review DATABASE.md to understand data model
4. Explore `lib/` directory for core utilities
5. Check `app/api/` for API route examples
6. Review `components/` for UI patterns
7. Test order flow using TEST_ORDER.md

## Contributing

### Before Making Changes
- Understand the existing patterns in similar files
- Check if utility functions already exist in `lib/utils/`
- Validate all user input with Zod schemas
- Add proper error handling
- Test locally before deploying

### When Adding Features
- Create types in `types/` directory
- Add validation schemas to `lib/validation/schemas.ts`
- Follow existing API response format
- Update relevant documentation
- Consider rate limiting for sensitive operations

### When Fixing Bugs
- Check DATABASE.md for data structure issues
- Review error logs for stack traces
- Test edge cases (empty data, invalid input)
- Verify fix doesn't break existing functionality
