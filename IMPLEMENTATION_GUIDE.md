# FlyVedya Tourism Management System - Implementation Guide

## ✅ COMPLETED CHANGES

### 1. **Package Master ↔ Tour Schedule Separation**

**Before:** Package had `start_date`, `end_date`, `bus_id` (departure-specific fields mixed with master template)

**After:**

- **Package** = Master template (stays the same, no departure-specific fields)
- **TourSchedule** = Individual departure runs (each specific date/price/bus/seats)

### 2. **New Models Created**

#### TourSchedule Model (`/backend/models/TourSchedule.js`)

```javascript
{
  package_id:       ObjectId → Link to Package Master
  start_date:       Date → Departure date
  end_date:         Date → Return date (optional)
  bus_id:           ObjectId → Bus for this departure
  price_per_person: Number → Price (can differ from master)
  total_seats:      Number → Seat count
  available_seats:  Number → Auto-updated when booking/cancellation
  seats:            [{seat_number, is_booked, booked_by, price}]
  departure_status: String (Draft|Open|Locked|Completed|Archived)
  has_bookings:     Boolean → Tracks if any booking made
}
```

**Status Meanings:**

- `Draft` - Admin setting up, not visible to users
- `Open` - Visible & bookable
- `Locked` - First booking made, admin can't edit date/price/bus
- `Completed` - Travel date passed (auto-marked by cron)
- `Archived` - Hidden from users

---

### 3. **Updated Models**

#### Package Model (removed fields)

```javascript
// REMOVED:
- start_date     ❌ (moved to TourSchedule)
- end_date       ❌ (moved to TourSchedule)
- bus_id         ❌ (moved to TourSchedule)

// KEPT:
- package_name, destination, hotels, duration, price, description, itinerary, etc.
- tour_guide, boarding_points, inclusive, exclusive
```

#### PackageBooking Model (new fields)

```javascript
{
  // Previous fields (kept for backward compatibility)
  Package_id, Custmer_id, travellers, seat_numbers, seat_price_details,
  price_per_person, total_amount, other_travelers, feedback_id,

  // ✅ NEW: Link to specific departure
  tour_schedule_id: ObjectId → Link to TourSchedule,

  // ✅ NEW: Time limits (per business guide)
  approval_deadline: Date  → Admin has 48 hours to approve
  payment_deadline:  Date  → User has 24 hours to pay

  // ✅ NEW: Status fields (per guide)
  booking_status: String (pending|approved|rejected|confirmed|completed|cancelled)
  payment_status: String (unpaid|paid|refunded)

  // ✅ NEW: Admin workflow
  admin_note, approved_at, rejected_at,

  // ✅ NEW: Cancellation tracking
  cancelled_by, cancellation_reason, cancelled_at,

  // ✅ NEW: Refund management
  refund_amount, refund_status,

  // ✅ NEW: Razorpay integration
  razorpay_order_id, razorpay_payment_id,

  // ✅ NEW: Review submission
  review_submitted: Boolean
}
```

#### Feedback Model (enhanced)

```javascript
{
  // ✅ IMPORTANT: Links to PACKAGE MASTER (not departure)
  // This means ALL reviews from ALL departures show on package page
  package_id:       ObjectId → Package Master (key to inheritance)
  tour_schedule_id: ObjectId → Which departure they travelled
  package_booking_id: ObjectId → Their specific booking

  // New rating fields
  hotel_rating:  Number (1-5)
  service_rating: Number (1-5)
  images:        [String]
  is_published:  Boolean
}
```

---

### 4. **New Controllers & Routes**

#### Tour Schedule Controller (`/backend/controllers/tourScheduleController.js`)

**Functions:**

- `createTourDeparture()` - Admin creates new departure for a package
- `getPackageDepartures()` - Get all departures for a package (filtered: Open/Locked for users, all for admin)
- `getTourDeparture()` - Get single departure detail + auto-complete check
- `updateTourDeparture()` - Update departure (blocked if Locked)
- `openDeparture()` - Admin changes Draft → Open
- `lockDeparture()` - Auto-called on first booking, prevents date/price/bus edits
- `getDepartureSeats()` - Get seat map and availability

#### Tour Schedule Routes (`/backend/routes/tourScheduleRoutes.js`)

```http
# Admin Routes
POST   /api/tour-schedules                    → Create departure
PUT    /api/tour-schedules/:id               → Update departure (if unlocked)
POST   /api/tour-schedules/:id/open          → Change status Draft→Open
POST   /api/tour-schedules/:id/lock          → Lock departure (block edits)

# Public Routes
GET    /api/tour-schedules/:id               → Get departure detail
GET    /api/tour-schedules/:id/seats         → Get seat availability
GET    /api/tour-schedules/package/:package_id/departures → All departures for package
```

#### Auto-Complete Helper (`/backend/utils/autoCompleteHelper.js`)

**Functions:**

- `autoCompleteTours()` - Mark tours Complete when start_date passes
- `autoRejectExpiredBookings()` - Auto-reject pending bookings after 48 hours - release seats
- `autoCancelUnpaidBookings()` - Auto-cancel approved bookings after 24 hours, release seats
- `runAllAutoTasks()` - Run all three above

**Cron Jobs Added to `index.js`:**

```javascript
// Every hour: Auto-complete tours and manage payment deadlines
cron.schedule("0 * * * *", async () => {
  await runAllAutoTasks();
});
```

---

### 5. **Backend Workflow (Tour Booking)**

#### Step 1: User browses Package Master

```http
GET /api/packages → List all packages
GET /api/packages/:id → Package detail
```

#### Step 2: User selects a departure

```http
GET /api/tour-schedules/package/:package_id/departures
→ Shows all Open/Locked departures with available_seats
```

#### Step 3: User selects seats

```http
GET /api/tour-schedules/:id/seats
→ Returns seat map and available_seats count
```

#### Step 4: User books (creates PackageBooking)

```http
POST /api/bookings/book
{
  package_id: "...",
  tour_schedule_id: "...",     // ✅ NEW: Link to specific departure
  travellers: 2,
  passengers: [
    { name: "Rahul", age: 28, gender: "Male" },
    { name: "Riya", age: 10, gender: "Female" }
  ],
  seat_numbers: ["S5", "S6"]
}

Response:
{
  booking._id: "...",
  booking_status: "pending",
  approval_deadline: "2026-03-31T10:00:00Z",  // ✅ 48 hours from now
  total_amount: 1000
}
```

**What happens automatically:**

- Seats marked `is_booked = true` in TourSchedule
- `available_seats` decremented
- If first booking → TourSchedule status changed to "Locked"
- `approval_deadline` set to now + 48 hours

#### Step 5: Admin reviews & approves

```http
PUT /api/bookings/:id/status
{
  "status": "approved"
}
→ payment_deadline set to now + 24 hours
```

#### Step 6: User pays via Razorpay

```http
POST /api/bookings/:id/confirm-payment
{
  "razorpay_order_id": "...",
  "razorpay_payment_id": "..."
}
→ booking_status = "confirmed"
→ payment_status = "paid"
```

#### Step 7: Cron auto-complete (30 days later)

```
Travel date passes → Cron runs → Booking marked "completed"
→ User can write review linked to Package Master
```

---

### 6. **Key Business Rules Implemented**

#### Review Inheritance

```
Package Master (has 100 reviews)
  ├─ TourSchedule A (March 25) → inherits all 100 reviews
  ├─ TourSchedule B (April 1) → inherits all 100 + any new reviews
  └─ TourSchedule C (April 15) → same
```

- All new departures automatically show past reviews
- New reviews always link to Package Master (not departure)
- Average rating calculated across ALL departures

#### Time Limits (Automatic)

```
Booking Created (pending)
    ↓ (48-hour deadline)
    Admin approves (approved)
    ↓ (24-hour deadline)
    User pays (confirmed)
    ↓
    Travel date passes → Auto-complete (completed)
```

**Cron auto-rejects after 48 hours, auto-cancels after 24 hours payment deadline**

#### Locking Mechanism

```
Departure Status Changes:
Draft → Open (admin)
Open → Locked (automatic on first booking)
      ↓
      (Cannot edit: date, price, bus_id anymore)
      ↓
Locked → Completed (automatic when travel date passes)
```

---

### 7. **Database Changes Summary**

| File                          | Changes                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Package.js                    | Removed `start_date`, `end_date`, `bus_id`                         |
| PackageBooking.js             | Added `tour_schedule_id`, approval/payment deadlines, status enums |
| Feedback.js                   | Added `tour_schedule_id`, enhanced ratings                         |
| **TourSchedule.js**           | **NEW MODEL** - Individual departure runs                          |
| **tourScheduleController.js** | **NEW** - Full CRUD + locking + status management                  |
| **tourScheduleRoutes.js**     | **NEW** - All routes for departures                                |
| **autoCompleteHelper.js**     | **NEW** - Auto-completion & deadline management                    |
| index.js                      | Added cron job, imported new routes                                |

---

### 8. **Frontend Integration Points**

> These will need frontend updates (not yet implemented)

#### New API calls needed:

```javascript
// Get departures for a package
GET /api/tour-schedules/package/:package_id/departures

// Get seat availability
GET /api/tour-schedules/:id/seats

// Create booking with tour_schedule_id
POST /api/bookings/book
{
  tour_schedule_id: "...",  // ✅ NEW!
  ...existing fields
}

// Check auto-completed bookings
GET /api/bookings/my-bookings
// Will now show booking_status = "completed" for past dates
```

#### Frontend Pages to Update:

1. **PackageDetails**
   - Show available departures (Open/Locked status)
   - Let user pick specific date

2. **PackageSeatSelection**
   - Get seats from specific TourSchedule (not Package)
   - Show real-time available_seats

3. **BookPackage**
   - Pass `tour_schedule_id` to booking API

4. **MyBookings**
   - Already handles various statuses
   - New statuses: "pending", "approved", "confirmed", "completed", "rejected", "cancelled"
   - Show time-based CTAs (e.g., "Pay by 24-Mar")

---

### 9. **Testing the Implementation**

#### Via cURL / Postman:

**1. Create a tour departure**

```bash
POST http://localhost:4000/api/tour-schedules
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "package_id": "65abc123...",
  "start_date": "2026-04-15T08:00:00Z",
  "end_date": "2026-04-19T18:00:00Z",
  "bus_id": "65def456...",
  "price_per_person": 5000,
  "notes": "Early bird tour"
}
```

**2. Open departure for bookings**

```bash
POST http://localhost:4000/api/tour-schedules/:id/open
Authorization: Bearer ADMIN_TOKEN
```

**3. Get departures for package**

```bash
GET http://localhost:4000/api/tour-schedules/package/65abc123/departures
```

**4. Book with tour_schedule_id**

```bash
POST http://localhost:4000/api/bookings/book
Authorization: Bearer CUSTOMER_TOKEN
Content-Type: application/json

{
  "package_id": "65abc123...",
  "tour_schedule_id": "65ghi789...",  // ✅ NEW!
  "travellers": 2,
  "passengers": [...],
  "seat_numbers": ["S1", "S2"]
}
```

---

### 10. **Next Steps for User**

1. ✅ **Backend Model & API** - COMPLETE
2. ⏳ **Frontend Integration** - Update components to:
   - Fetch departures for selected package
   - Pass `tour_schedule_id` in booking request
   - Show new booking statuses (pending, approved, confirmed, etc.)
3. ⏳ **Admin Panel** - Add CRUD UI for TourSchedules
4. ⏳ **Real-time Updates** - Optional WebSocket for live seat availability

---

## KEY TAKEAWAYS

### Before (Mixed concerns):

```
Package → had start_date, bus, seats (conflicted when edited)
Booking → linked to Package directly
```

### After (Separation of concerns):

```
Package (Template)
    ↓
TourSchedule A (March 25) → Booking A, B, C
TourSchedule B (April 1)  → Booking D, E
TourSchedule C (April 15) → Booking F

Benefits:
✓ Edit Package template doesn't affect past bookings
✓ Repeat tours don't conflict with price changes
✓ Reviews accumulate on Package Master across all departures
✓ Admin can lock departures after first booking (immutability)
✓ Auto-complete & time limits fully automated
```

---

## FILE LOCATIONS

```
backend/
  models/
    ├─ TourSchedule.js          ← NEW
    ├─ Package.js               ← UPDATED (removed date/bus fields)
    ├─ PackageBooking.js        ← UPDATED (added tour_schedule_id, deadlines)
    └─ Feedback.js              ← UPDATED (enhanced ratings)

  controllers/
    ├─ tourScheduleController.js ← NEW
    └─ (tourbookingController.js) ← Already had updateMyPackageBooking()

  routes/
    ├─ tourScheduleRoutes.js     ← NEW
    └─ tourbookingRoutes.js      ← Existing

  utils/
    └─ autoCompleteHelper.js     ← NEW

  index.js                        ← UPDATED (added routes, cron)
```

---

**Status:** ✅ BACKEND COMPLETE - Ready for frontend integration
