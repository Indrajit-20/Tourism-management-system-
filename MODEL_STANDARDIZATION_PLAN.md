# Model Field Naming Inconsistencies - DIAGNOSIS REPORT

## Problem Summary
The system has **mixed/inconsistent field naming** across models and controllers causing:
- ❌ Admin functions broken
- ❌ Payment system not working
- ❌ Cancellation not working
- ❌ Refunds not processing
- ❌ Invoices not generating

---

## Inconsistencies Found

### 1. **Customer ID Field Name**
| Model/Controller | Current Name | Issue |
|------------------|-------------|-------|
| `BusTicketBooking.js` | `customer_id` | ✅ CORRECT |
| `PackageBooking.js` | `customer_id` | ✅ CORRECT |
| `Cancellation.js` | `custmer_id` | ❌ TYPO (misspelled) |
| `Refund.js` | `custmer_id` | ❌ TYPO (misspelled) |
| `Invoice.js` | `custmer_id` | ❌ TYPO (misspelled) |
| `tourbookingController.js` | `customer_id` | ✅ CORRECT |
| `cancellationController.js` | Mixed: `custmer_id` + `Custmer_id` | ❌ TYPO + CASE MISMATCH |
| `refundController.js` | `custmer_id` | ❌ TYPO |
| `invoiceController.js` | `custmer_id` | ❌ TYPO |

---

## Solution: Standardize to `customer_id`

### Step 1: Fix Models (Use `customer_id` - correct spelling)
1. ✅ `PackageBooking.js` - Already correct
2. ✅ `BusTicketBooking.js` - Already correct
3. ❌ `Cancellation.js` - Change `custmer_id` → `customer_id`
4. ❌ `Refund.js` - Change `custmer_id` → `customer_id`
5. ❌ `Invoice.js` - Change `custmer_id` → `customer_id`
6. ✅ `Passenger.js` - No customer field (uses booking references)

### Step 2: Fix Controllers (Use `customer_id` consistently)
1. ❌ `cancellationController.js` - 10 fixes needed
2. ❌ `refundController.js` - 5 fixes needed
3. ❌ `invoiceController.js` - 5 fixes needed
4. ✅ `tourbookingController.js` - Already fixed
5. ✅ `busBookingController.js` - Verify

### Step 3: Fix Frontend if needed
- Verify front-end components use correct field names

---

## Impact Assessment

| Component | Affected | Severity |
|-----------|----------|----------|
| Tour Booking | Medium | Payment confirmation, getMyBookings |
| Bus Booking | High | Admin view, cancellations |
| Cancellations | Critical | Cannot create/view cancellations |
| Refunds | Critical | Cannot process refunds |
| Invoices | High | Cannot generate invoices |
| Admin Dashboard | High | Cannot view bookings/refunds |

---

## Files to Modify

```
✅ Models (3):
  - Cancellation.js
  - Refund.js
  - Invoice.js

✅ Controllers (3):
  - cancellationController.js
  - refundController.js
  - invoiceController.js
```

**Total Changes Needed:** ~25+ field references

---

## Standardization Rule

```javascript
// CORRECT (Use this everywhere):
customer_id        // References Custmer model
package_id         // References Package model
booking_id         // Polymorphic reference
tour_schedule_id   // References TourSchedule model

// WRONG (Don't use):
custmer_id         // TYPO - misspelled "customer"
Custmer_id         // TYPO + CASE MISMATCH
Customer_id        // Not used in codebase
Package_id         // Use lowercase: package_id
```

---

## Next Actions

1. Fix all 3 models (replace `custmer_id` with `customer_id`)
2. Fix all 3 controllers (replace `custmer_id`/`Custmer_id` with `customer_id`)
3. Test critical flows:
   - Create booking → Get user bookings → Cancel booking → Refund
   - View admin page
   - Generate invoice

