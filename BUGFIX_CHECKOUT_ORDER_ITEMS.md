# Bug Fix: Checkout Order Items Error

**Date**: 2026-01-03  
**Status**: ✅ Fixed  
**Severity**: High (blocking checkout functionality)

## Problem Summary

When submitting an order at `/checkout`, the application displayed the error:
```
Cannot read properties of undefined (reading 'length')
```

This prevented customers from completing orders successfully.

## Root Causes Identified

### 1. **Type Mismatch in Form Values vs Schema** (Fixed)
**Location**: `components/customer/CheckoutForm.tsx` lines 217-235

**Problem**: 
- Form used `delivery` but schema expected `home_delivery`
- Form used `transfer` but schema expected `bank_transfer`
- Form was missing `line_pay` option

**Fix**: Updated form select options to match validation schemas
```tsx
// Before:
<option value="delivery">外送</option>
<option value="transfer">轉帳</option>

// After:
<option value="home_delivery">外送</option>
<option value="bank_transfer">轉帳</option>
<option value="line_pay">LINE Pay</option>
```

### 2. **Type Definition Mismatch** (Fixed)
**Location**: `types/order.ts` lines 7-9

**Problem**: Type definitions didn't match validation schemas
```typescript
// Before:
export type PickupMethod = 'self_pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card';
export type GrindOption = 'none' | 'hand_drip' | 'espresso';

// After:
export type PickupMethod = 'self_pickup' | 'home_delivery';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'line_pay';
export type GrindOption = 'whole_bean' | 'fine' | 'medium' | 'coarse';
```

### 3. **Wrong State Variable Name** (Fixed)
**Location**: `components/customer/CheckoutForm.tsx` line 63

**Problem**: Used `setIsLoading` when state variable was `isSubmitting`
```typescript
// Before:
setIsLoading(false);

// After:
setIsSubmitting(false);
```

### 4. **Field Name Mismatch in mapOrderRecord** (Fixed) ⚠️ **CRITICAL**
**Location**: `lib/supabase/orders.ts` line 311

**Problem**: Function returned `items` field but Order type expects `order_items`
```typescript
// Before:
return {
  ...orderRecord,
  items,  // ❌ Wrong field name
}

// After:
return {
  ...orderRecord,
  order_items: items,  // ✅ Correct field name
}
```

This was the main cause of "Cannot read properties of undefined (reading 'length')" because:
- API route tried to access `order.order_items.map()`
- But `order.order_items` was undefined (only `order.items` existed)
- The `.map()` call on undefined threw the error

### 5. **Wrong Import in Order API Route** (Fixed)
**Location**: `app/api/orders/order-id/[orderId]/route.ts` line 1

**Problem**: API imported from Airtable instead of Supabase
```typescript
// Before:
import { getOrderByOrderId } from '@/lib/airtable/orders';

// After:
import { getOrderByOrderId } from '@/lib/supabase/orders';
```

This caused "Order not found" on the order tracking page after successful order creation.

### 6. **Defensive Programming - Array Safety** (Fixed)
**Locations**: 
- `lib/supabase/orders.ts` line 286
- `app/api/orders/route.ts` line 70

**Added defensive checks**:
```typescript
// Ensure arrays are never undefined
const items: OrderItem[] = (itemsRecords || []).map(...);
order_items: (order.order_items || []).map(...);
```

## Prevention Checklist

To avoid similar issues in the future:

### ✅ Type Consistency
- [ ] Ensure TypeScript types match validation schemas (Zod)
- [ ] Keep enum values consistent across:
  - Type definitions (`types/*.ts`)
  - Validation schemas (`lib/validation/schemas.ts`)
  - Form components (select options, radio buttons)
  - Database schemas

### ✅ Field Name Consistency
- [ ] Check that data transformation functions use correct field names
- [ ] Verify return types match TypeScript interfaces exactly
- [ ] Common mistake: `items` vs `order_items`, `data` vs `result`, etc.

### ✅ Data Source Consistency
- [ ] When migrating from one data source to another (Airtable → Supabase):
  - [ ] Update ALL API route imports
  - [ ] Update ALL component imports
  - [ ] Search codebase for old imports: `grep -r "airtable" --include="*.ts" --include="*.tsx"`

### ✅ State Management
- [ ] Use consistent state variable names
- [ ] When copying code, update variable references
- [ ] Common mistake: `isLoading` vs `isSubmitting` vs `loading`

### ✅ Defensive Programming
- [ ] Always check if arrays/objects exist before accessing properties
- [ ] Use optional chaining: `data?.items?.length`
- [ ] Provide default values: `items || []`
- [ ] Handle undefined/null cases explicitly

### ✅ Testing Strategy
- [ ] Test the complete flow: form submission → API → database → display
- [ ] Test with browser DevTools Console and Network tabs open
- [ ] Check both success and error cases
- [ ] Verify data structure at each step

## Quick Reference: Common Mismatches to Check

| Component | Location | Should Match |
|-----------|----------|--------------|
| Form select values | `components/customer/CheckoutForm.tsx` | Zod schemas |
| Type definitions | `types/order.ts` | Zod schemas |
| API return values | `lib/supabase/orders.ts` | Type interfaces |
| API imports | `app/api/*/route.ts` | Current data source |
| State variables | Component files | Consistent naming |

## Files Modified

1. ✅ `components/customer/CheckoutForm.tsx` - Form values and state variable
2. ✅ `types/order.ts` - Type definitions
3. ✅ `lib/supabase/orders.ts` - Field name in mapOrderRecord + defensive array check
4. ✅ `app/api/orders/route.ts` - Defensive array check
5. ✅ `app/api/orders/order-id/[orderId]/route.ts` - Import source
6. ✅ `app/api/auth/register/route.ts` - Import from Supabase instead of Airtable (2026-01-03)

## Testing Done

- ✅ Order creation works correctly
- ✅ Order tracking page displays order details
- ✅ No "Cannot read properties of undefined" errors
- ✅ Form validation works with correct enum values
- ✅ Data persists to Supabase correctly

## Notes for Future Development

1. **Before adding new enum types**: Update all three locations simultaneously (types, schemas, forms)
2. **Before migrating data sources**: Use global search to find all imports
3. **When mapping data**: Always verify field names match TypeScript interfaces
4. **When copying components**: Update all variable references, don't assume they match

## Related Documentation

- `lib/validation/schemas.ts` - Source of truth for validation rules
- `types/order.ts` - Source of truth for type definitions
- `SUPABASE_MIGRATION_RISK_ASSESSMENT.md` - Migration considerations
