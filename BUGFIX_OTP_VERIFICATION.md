# Bug Fix: OTP Verification Issues

**Date**: 2026-01-03  
**Status**: ✅ Fixed  
**Severity**: High (blocking user registration and login)

## Problem Summary

Users were unable to complete OTP verification despite entering the correct OTP code. The system displayed "驗證碼錯誤，請重新輸入" (Invalid OTP code) even with valid codes.

Additionally, OTP tokens were not being saved to the Supabase `otp_tokens` table during registration.

## Root Causes Identified

### 1. **Registration API Using Wrong Data Source** (Fixed)
**Location**: `app/api/auth/register/route.ts` lines 2-5

**Problem**: API was importing from Airtable instead of Supabase
```typescript
// Before:
import { findCustomerByEmail } from '@/lib/airtable/customers';
import { getCustomerByPhone } from '@/lib/airtable/customers';
import { createOrUpdateCustomer } from '@/lib/airtable/customers';
import { createOTPToken } from '@/lib/airtable/otp';

// After:
import { findCustomerByEmail, getCustomerByPhone, createOrUpdateCustomer } from '@/lib/supabase/customers';
import { createOTPToken } from '@/lib/supabase/otp';
```

**Impact**: 
- Registration checked for existing emails in Airtable instead of Supabase
- New users appeared as "already registered" when they weren't
- OTP tokens were being saved to Airtable, not Supabase

### 2. **Missing OTP Code Parameter** (Fixed)
**Location**: `app/api/auth/register/route.ts` line 66

**Problem**: `createOTPToken` requires two parameters but only one was provided
```typescript
// Before:
const otpToken = await createOTPToken(email); // ❌ Missing otpCode parameter

// After:
const { generateOTP } = require('@/lib/auth/otp-generator');
const otpCode = generateOTP();
const otpToken = await createOTPToken(email, otpCode); // ✅ Both parameters
```

**Impact**: 
- Function call failed or used undefined as otpCode
- OTP tokens were not properly created in database

### 3. **Return Type Mismatch in verifyOTPCode** (Fixed) ⚠️ **CRITICAL**
**Location**: `lib/supabase/otp.ts` verifyOTPCode function

**Problem**: Function returned `boolean` but API expected `{ success: boolean; error?: string }`

```typescript
// Before:
export async function verifyOTPCode(
  email: string, 
  otpCode: string
): Promise<boolean> {
  // ...
  return true; // or false
}

// API tried to access:
if (!verifyResult.success) {  // ❌ undefined, because boolean has no .success property
  // ...
}
```

**After**:
```typescript
export async function verifyOTPCode(
  email: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ... validation logic
    
    if (error.code === 'PGRST116') {
      return { success: false, error: '驗證碼無效或已過期' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { success: false, error: '驗證碼已過期' };
    }

    if (data.is_used) {
      return { success: false, error: '驗證碼已使用' };
    }

    // Mark as used
    await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .update({ is_used: true })
      .eq('id', data.id);

    return { success: true };
  } catch (error) {
    return { success: false, error: '驗證失敗，請重試' };
  }
}
```

**Impact**:
- API tried to access `verifyResult.success` on a boolean value
- Always evaluated to `undefined`, triggering false negative
- All OTP verifications failed regardless of correctness

## Detailed Analysis

### Why OTP Verification Always Failed

1. **Function returns boolean**: `true` or `false`
2. **API expects object**: `{ success: boolean, error?: string }`
3. **API code**:
   ```typescript
   const verifyResult = await verifyOTPCode(email, otpCode);
   if (!verifyResult.success) {  // ← accessing .success on boolean
     // This always fails because boolean.success === undefined
   }
   ```
4. **Result**: `true.success` → `undefined` → `!undefined` → `true` → error thrown

### Why Registration Showed "Email Already Registered"

1. Registration API imported from `@/lib/airtable/customers`
2. Checked if email exists in **Airtable** database
3. Order system migrated to Supabase, but auth system still used Airtable
4. Email didn't exist in Supabase but might exist in old Airtable data
5. Result: False positive "already registered" errors

### Why OTP Tokens Weren't Saved

1. `createOTPToken(email, otpCode)` requires 2 parameters
2. Registration only passed `createOTPToken(email)` - 1 parameter
3. Function either:
   - Failed silently
   - Used `undefined` as otpCode
   - Threw error that was caught and ignored
4. No token was saved to `otp_tokens` table

## Enhanced Validation in verifyOTPCode

The updated function now includes comprehensive checks:

### 1. **Invalid/Not Found Check**
```typescript
if (error.code === 'PGRST116') {
  return { success: false, error: '驗證碼無效或已過期' };
}
```
Catches cases where OTP doesn't exist in database

### 2. **Expiration Check**
```typescript
if (new Date(data.expires_at) < new Date()) {
  return { success: false, error: '驗證碼已過期' };
}
```
Ensures OTP hasn't exceeded 10-minute validity period

### 3. **Already Used Check**
```typescript
if (data.is_used) {
  return { success: false, error: '驗證碼已使用' };
}
```
Prevents OTP reuse attacks

### 4. **Update Error Handling**
```typescript
const { error: updateError } = await supabaseAdmin
  .from(TABLES.OTP_TOKENS)
  .update({ is_used: true })
  .eq('id', data.id);

if (updateError) {
  return { success: false, error: '驗證失敗，請重試' };
}
```
Ensures OTP is properly marked as used

## Prevention Checklist

### ✅ Function Return Types
- [ ] Ensure return type matches what calling code expects
- [ ] Don't return `boolean` when caller expects `{ success: boolean }`
- [ ] Document return type in JSDoc comments
- [ ] Use TypeScript strict mode to catch mismatches

### ✅ Function Parameters
- [ ] Verify all required parameters are passed
- [ ] Check function signature before calling
- [ ] Don't assume optional parameters have defaults
- [ ] Use TypeScript to enforce parameter requirements

### ✅ Data Source Consistency After Migration
- [ ] Update ALL imports when migrating data sources
- [ ] Check API routes: `app/api/**/*.ts`
- [ ] Check client components
- [ ] Check server components
- [ ] Check utility functions
- [ ] Use global search: `grep -r "@/lib/airtable" --include="*.ts" --include="*.tsx"`

### ✅ API Contract Validation
- [ ] Ensure called functions return expected format
- [ ] Add TypeScript interfaces for return types
- [ ] Test with actual data, not just type checking
- [ ] Add error handling for unexpected formats

## Common Patterns to Avoid

### ❌ BAD: Assuming Return Type
```typescript
const result = await someFunction();
if (!result.success) {  // Assumes result is object with .success
  // ...
}
```

### ✅ GOOD: Validate Return Type
```typescript
const result = await someFunction();
if (typeof result === 'boolean') {
  // Handle boolean case
} else if (result && typeof result === 'object' && 'success' in result) {
  if (!result.success) {
    // Handle error
  }
}
```

### ❌ BAD: Missing Required Parameters
```typescript
const token = await createOTPToken(email);  // Missing otpCode
```

### ✅ GOOD: Provide All Required Parameters
```typescript
const otpCode = generateOTP();
const token = await createOTPToken(email, otpCode);
```

### ❌ BAD: Inconsistent Imports After Migration
```typescript
// Some files use Airtable
import { findCustomer } from '@/lib/airtable/customers';

// Other files use Supabase
import { findCustomer } from '@/lib/supabase/customers';
```

### ✅ GOOD: Consistent Data Source
```typescript
// All files use Supabase after migration
import { findCustomer } from '@/lib/supabase/customers';
```

## Files Modified

1. ✅ `app/api/auth/register/route.ts` - Import from Supabase + generate OTP code
2. ✅ `lib/supabase/otp.ts` - Return object instead of boolean, add comprehensive validation

## Testing Checklist

### Registration Flow
- [ ] Register with new email → Should succeed
- [ ] Register with existing email → Should show "Email already registered"
- [ ] Check `otp_tokens` table → Should have new record
- [ ] Check OTP email → Should receive 6-digit code

### OTP Verification Flow
- [ ] Enter correct OTP → Should verify successfully
- [ ] Enter wrong OTP → Should show "驗證碼錯誤"
- [ ] Enter expired OTP (>10 min) → Should show "驗證碼已過期"
- [ ] Reuse same OTP → Should show "驗證碼已使用"
- [ ] Check `otp_tokens` table → `is_used` should be `true`

### Database Consistency
- [ ] New customers saved to `customers` table in Supabase
- [ ] OTP tokens saved to `otp_tokens` table in Supabase
- [ ] No data written to Airtable
- [ ] All queries read from Supabase

## Quick Debugging Commands

```bash
# Find all Airtable imports (should be zero after migration)
grep -r "from '@/lib/airtable" --include="*.ts" --include="*.tsx"

# Find function calls with potentially missing parameters
grep -r "createOTPToken(" --include="*.ts"

# Find boolean return type declarations
grep -r "Promise<boolean>" --include="*.ts"

# Check OTP verification calls
grep -r "verifyOTPCode" --include="*.ts"
```

## Database Schema Reference

### otp_tokens Table
```sql
CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields**:
- `otp_code`: 6-digit verification code
- `expires_at`: Valid for 10 minutes from creation
- `is_used`: Prevents OTP reuse
- `email`: Lowercase normalized email address

## Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| 驗證碼錯誤，請重新輸入 | Wrong OTP or return type mismatch | Enter correct OTP, check function return type |
| 驗證碼無效或已過期 | OTP not found in database | Request new OTP |
| 驗證碼已過期 | OTP older than 10 minutes | Request new OTP |
| 驗證碼已使用 | OTP already verified once | Request new OTP |
| 此 Email 已被註冊 | Email exists in Airtable (not Supabase) | Check correct database, update imports |
| 驗證失敗，請重試 | Database error or network issue | Check Supabase connection, retry |

## Related Documentation

- `BUGFIX_CHECKOUT_ORDER_ITEMS.md` - Checkout and order creation fixes
- `.cursor/AGENTS.md` - Best practices and prevention guidelines
- `lib/supabase/otp.ts` - OTP token management functions
- `lib/validation/schemas.ts` - OTP validation schema

## Lessons Learned

1. **Always match return types**: Don't return `boolean` when caller expects object
2. **TypeScript is your friend**: Use strict types to catch mismatches at compile time
3. **Migration is not done until ALL imports are updated**: One missed import breaks features
4. **Test the complete flow**: Registration → OTP email → Verification → Login
5. **Defensive error messages**: Provide specific feedback (expired vs invalid vs used)

## Future Improvements

1. **Add TypeScript strict mode** to catch return type mismatches
2. **Create integration tests** for auth flow
3. **Add API contract tests** to verify return formats
4. **Implement migration checklist** before deploying data source changes
5. **Add monitoring** for OTP verification success rates
