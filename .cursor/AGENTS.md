# Agent Memory: Common Issues and Best Practices

This file contains lessons learned from debugging sessions to help prevent recurring issues.

## Critical Issues to Check First

### 1. Type Consistency Across the Stack ⚠️ HIGH PRIORITY

**Always verify these match exactly:**
- TypeScript type definitions (`types/*.ts`)
- Zod validation schemas (`lib/validation/schemas.ts`)
- Form component values (select options, radio buttons)
- Database column names and constraints

**Recent Issue (2026-01-03):**
```typescript
// ❌ BAD: Mismatched values
// Form had: 'delivery', 'transfer'
// Schema expected: 'home_delivery', 'bank_transfer'
// Type defined: 'delivery', 'transfer'

// ✅ GOOD: All match
// Form: 'home_delivery', 'bank_transfer'
// Schema: 'home_delivery', 'bank_transfer'
// Type: 'home_delivery', 'bank_transfer'
```

### 2. Field Name Consistency in Data Mapping ⚠️ CRITICAL

**Common mistake:** Returning wrong field names from data transformation functions

**Check pattern:**
```typescript
// Interface expects 'order_items'
interface Order {
  order_items: OrderItem[];
}

// But function returns 'items' ❌
function mapOrderRecord(record, items) {
  return {
    ...record,
    items,  // WRONG! Should be 'order_items'
  };
}

// Accessing order.order_items will be undefined
// Causes: "Cannot read properties of undefined (reading 'length')"
```

**Fix:** Always match interface field names exactly
```typescript
function mapOrderRecord(record, items) {
  return {
    ...record,
    order_items: items,  // ✅ Matches interface
  };
}
```

### 3. Data Source Migration Consistency

**When migrating from Airtable to Supabase (or any data source change):**

1. **Search and replace ALL imports:**
   ```bash
   # Find all airtable imports
   grep -r "from '@/lib/airtable" --include="*.ts" --include="*.tsx"
   
   # Should update to:
   # from '@/lib/supabase/...'
   ```

2. **Check these locations:**
   - API routes (`app/api/**/*.ts`)
   - Server components
   - Server actions
   - Utility functions

3. **Common missed locations:**
   - Order tracking API: `app/api/orders/order-id/[orderId]/route.ts`
   - Admin pages that fetch data
   - Background jobs or webhooks

### 4. State Variable Naming

**Issue:** Copy-pasting code with different state variable names

```typescript
// ❌ BAD: Inconsistent naming
const [isSubmitting, setIsSubmitting] = useState(false);
// Later in code:
setIsLoading(false);  // Error! setIsLoading doesn't exist

// ✅ GOOD: Use correct variable
setIsSubmitting(false);
```

**Prevention:** Search for all `set*` calls when copying code blocks

### 5. Defensive Programming for Arrays and Objects

**Always assume data might be undefined:**

```typescript
// ❌ BAD: Assumes items exists
items.map(item => ...)

// ✅ GOOD: Defensive check
(items || []).map(item => ...)

// ✅ GOOD: Optional chaining
items?.map(item => ...) ?? []

// ✅ GOOD: Early return
if (!items || items.length === 0) return [];
const mapped = items.map(item => ...);
```

## Debugging Workflow

When encountering "Cannot read properties of undefined (reading 'X')":

1. **Identify the line number** - Check browser console for exact location
2. **Check the object structure** - Add `console.log(object)` before the failing line
3. **Trace data flow** - Where does this object come from?
4. **Check interface vs implementation** - Do field names match?
5. **Add defensive checks** - Use optional chaining or default values

## Code Review Checklist

Before committing changes that involve:

### Adding New Enum Types
- [ ] Update TypeScript type definition
- [ ] Update Zod validation schema
- [ ] Update all form components using this type
- [ ] Update database schema if applicable
- [ ] Update any display formatting functions

### Data Transformation Functions
- [ ] Return object matches TypeScript interface exactly
- [ ] All required fields are present
- [ ] Field names match (not `items` vs `order_items`)
- [ ] Handle null/undefined inputs gracefully

### Migrating Data Sources
- [ ] Search entire codebase for old imports
- [ ] Update API routes
- [ ] Update server components
- [ ] Update client components
- [ ] Test complete user flows

### Form Components
- [ ] Select/radio values match validation schema
- [ ] All enum values are present
- [ ] Error messages are clear
- [ ] State variables are named consistently

## Testing Strategy

### Manual Testing Priority
1. **Complete user flows** - Not just individual pages
2. **Browser DevTools open** - Console + Network tabs
3. **Check API responses** - Verify data structure
4. **Test error cases** - Empty carts, invalid inputs
5. **Check redirects** - After form submission

### Common Test Cases
```typescript
// Test: Empty cart checkout
// Expected: Show "購物車是空的" message

// Test: Valid form submission
// Expected: Create order + redirect to order page

// Test: Order tracking
// Expected: Display order details with items

// Test: Invalid form values
// Expected: Show validation errors
```

## Quick Commands

```bash
# Find all uses of a type
grep -r "PickupMethod" --include="*.ts" --include="*.tsx"

# Find all imports from a module
grep -r "from '@/lib/airtable" --include="*.ts" --include="*.tsx"

# Find state variable definitions
grep -r "useState<.*>" --include="*.tsx"

# Find all API route files
find app/api -name "route.ts"
```

## Common Error Patterns and Solutions

| Error Message | Common Cause | Solution |
|--------------|--------------|----------|
| Cannot read properties of undefined (reading 'length') | Accessing array that doesn't exist | Add defensive check: `(arr \|\| [])` |
| Cannot read properties of undefined (reading 'map') | Same as above | Same as above |
| Validation error: Invalid enum value | Form value doesn't match schema | Update form values to match schema |
| Order not found | API using wrong data source | Check import statement |
| setXXX is not defined | Using wrong state setter | Search for useState declaration |

## Prevention Mantras

1. **"Match the interface"** - Field names must be exact
2. **"Check the source"** - Are you importing from the right place?
3. **"Defend the data"** - Always assume it might be undefined
4. **"Validate everywhere"** - Types, schemas, and forms must align
5. **"Test the flow"** - Not just individual components

## Related Files

- `BUGFIX_CHECKOUT_ORDER_ITEMS.md` - Detailed fix for 2026-01-03 checkout issue
- `lib/validation/schemas.ts` - Source of truth for validation
- `types/order.ts` - Source of truth for Order types
- `SUPABASE_MIGRATION_RISK_ASSESSMENT.md` - Data source migration notes
