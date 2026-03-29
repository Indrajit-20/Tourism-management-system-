# Tour Package Booking, Cancellation, and Refund Guide

## 1. Purpose

This document explains the complete Tour Package module flow in practical, step-by-step format:

- Package browsing and departure selection
- Seat booking and passenger capture
- Admin approval and payment windows
- Cancellation and refund calculation
- Completion and review submission

It is written for Product, Admin, Support, QA, and Development teams.

---

## 2. Core Entities

### 2.1 Package Master

Template record with package-level details:

- package_name
- source_city, destination
- duration
- boarding_points (pickup options)
- hotels, itinerary, inclusions, exclusions
- media and description

### 2.2 Tour Departure (Schedule)

Operational record for one run/date of a package:

- package_id
- start_date, end_date
- bus_id
- price
- seats[] with is_booked and booked_by
- available_seats, total_seats
- departure_status (Draft/Open/Locked/BookingFull/Completed/Archived)

### 2.3 Package Booking

Customer booking for one departure:

- Package_id
- tour_schedule_id
- Custmer_id
- seat_numbers
- travellers
- pickup_location
- total_amount and seat_price_details
- booking_status (pending/approved/confirmed/rejected/cancelled/completed)
- payment_status (unpaid/paid/refunded)
- deadlines: approval_deadline, payment_deadline
- cancellation/refund fields
- review_submitted, feedback_id/review_id

### 2.4 Passenger

Passenger records linked to booking:

- passenger_name, age, gender
- lead passenger flags and Aadhaar details

### 2.5 Feedback

Review linked to:

- package_id (master-level aggregation)
- booking_id/package_booking_id
- departure_id

---

## 3. End-to-End Booking Flow

## Step 1: User browses Package Master list

- User opens package listing page.
- User selects one package to view details.

## Step 2: User views available departures

- System shows departures for that package.
- Bookable statuses are Open and Locked.
- Draft/Completed/Archived are not bookable.

## Step 3: User selects one departure

- Departure is tied to date, bus, seat inventory, and price.

## Step 4: User selects seats on visual map

- White: available
- Red: already booked
- Green: selected in current session

## Step 5: User enters passenger details per seat

- Passenger count must equal selected seat count.
- Lead passenger requires:
  - name, age, gender
  - aadhaar_number (12 digits)
  - aadhaar_photo (JPG/PNG, max 2MB)
- Passenger 2+ require:
  - name, age, gender

## Step 6: User selects pickup location

- Must be one of admin-configured boarding_points for that package.

## Step 7: User sees summary

- Seat-wise fare and total amount are shown.

## Step 8: User submits booking

- Booking is created with status pending.
- approval_deadline = now + 48 hours.
- Seats are temporarily reserved immediately (is_booked = true).
- User sees: Booking submitted! Waiting for admin approval.

## Step 9: Admin action window (48 hours)

- Admin can approve or reject pending booking.
- If no action in time, cron auto-rejects.

## Step 10: If admin approves

- booking_status = approved
- payment_deadline = now + 24 hours
- User is expected to pay from My Bookings screen.

## Step 11: User payment from My Bookings

- User clicks Pay Now.
- Razorpay opens for full amount.
- On success:
  - payment_status = paid
  - booking_status = confirmed

## Step 12: Travel completion

- Cron marks booking completed after travel date passes.
- booking_status = completed

## Step 13: Review submission

- User can submit one review per completed booking.
- Review is linked to package master for long-term display.

---

## 4. Time-Limit Automation

## 4.1 Approval timeout (48h)

When:

- booking_status = pending
- approval_deadline expired

Action:

- booking_status = rejected
- admin_note = Auto rejected - not reviewed within 48 hours
- reserved seats are released

## 4.2 Payment timeout (24h)

When:

- booking_status = approved
- payment_deadline expired

Action:

- booking_status = cancelled
- seats are released

## 4.3 Completion automation

When:

- booking_status = confirmed
- travel date passed

Action:

- booking_status = completed

---

## 5. Cancellation Rules and Refund Policy

## 5.1 Status-based cancellation eligibility

- pending: allowed
- approved: allowed
- confirmed: allowed with refund slab
- completed: not allowed
- cancelled: not allowed again

## 5.2 Confirmed booking refund slab

Based on days before departure:

- 15+ days: 100%
- 7 to 14 days: 50%
- 3 to 6 days: 25%
- less than 3 days: cancellation blocked

## 5.3 Pre-confirmation preview requirement

Before final cancellation, show user:

- Amount paid
- Refund amount
- Non-refundable amount

## 5.4 Seat handling on cancellation

If cancellation is successful:

- booking_status updates to cancelled
- assigned seats are released
- available_seats is recalculated
- if departure was BookingFull and seats reopen, status moves to Locked

## 5.5 Admin cancellation

Business policy: 100% refund if admin cancels.

---

## 6. Departure Locking Rules

## 6.1 Editable states

- Draft and Open:
  - admin can edit date, bus, price

## 6.2 First booking lock

- On first successful booking from Open:
  - departure_status moves to Locked

## 6.3 Locked state restrictions

- Locked:
  - date, bus, price changes are blocked
  - non-core fields like notes/content can still be updated

## 6.4 Completion

- Once departure date/travel passes:
  - departure_status = Completed

---

## 7. Validation Rules (Booking)

## 7.1 Date validation

- travel date must be in future
- booking must be at least 3 days before departure
- booking cannot be more than 6 months ahead

## 7.2 Seat validation

- seat must be valid for bus layout
- seat cannot already be booked
- selected seats count must match passengers count
- max 10 passengers per booking

## 7.3 Aadhaar validation (lead passenger)

- exactly 12 digits numeric
- photo required, JPG/PNG, max 2MB

## 7.4 Pickup location validation

- must exist in package boarding_points

## 7.5 Duplicate active booking prevention

- one customer cannot create another active booking
  (pending/approved/confirmed) for the same departure

## 7.6 Departure status validation

- only Open or Locked departures are bookable

---

## 8. Review and Feedback Rules

## 8.1 Eligibility

- booking must be completed
- customer must own the booking

## 8.2 One review per booking

- if review_submitted is true and feedback exists, block another review

## 8.3 Linking model

Review stores:

- package_id (master package)
- booking_id/package_booking_id
- departure_id

## 8.4 Display model

Package page shows all reviews for package_id across all departures.

## 8.5 Rating aggregation

Average rating is computed from all package reviews linked to package_id.

---

## 9. API Surface (Tour Package Scope)

## 9.1 Package APIs

- GET /api/packages
- GET /api/packages/:id
- GET /api/packages/:package_id/departures
- GET /api/packages/:package_id/reviews

## 9.2 Departure APIs

- GET /api/departures (admin)
- POST /api/departures (admin)
- GET /api/departures/:id
- PUT /api/departures/:id (admin)
- DELETE /api/departures/:id (admin)
- POST /api/departures/:id/open (admin)
- GET /api/departures/:id/seats

Note: /api/tour-schedules aliases exist and point to the same controller set.

## 9.3 Booking APIs

- POST /api/bookings/book
- POST /api/bookings/confirm-payment
- GET /api/bookings/my-bookings
- GET /api/bookings/all (admin)
- PUT /api/bookings/update-status/:id (admin)

## 9.4 Cancellation APIs

- POST /api/cancellation/preview
- POST /api/cancellation/cancel

## 9.5 Feedback APIs

- POST /api/feedback/submit
- GET /api/feedback/package/:package_id
- GET /api/feedback/rating/package/:package_id

---

## 10. QA Checklist

## Booking

- Can book only Open/Locked departures.
- Cannot book Draft/Completed/Archived.
- Cannot overbook seats.
- Cannot book same departure twice with active status.
- Cannot submit without lead Aadhaar photo.

## Approval and payment

- Approve sets 24h payment deadline.
- Payment updates to confirmed/paid.
- Expired approved booking auto-cancels and releases seats.

## Cancellation

- Preview shows paid/refund/non-refundable amounts.
- Confirmed bookings follow slab correctly.
- Less than 3 days confirmed cancellation blocked.
- Seats are released on valid cancellation.

## Review

- Only completed booking can review.
- One review per booking enforced.
- Reviews visible on package page from all departures.

---

## 11. Operational Notes

- Cron jobs are critical for status lifecycle correctness.
- Seat state and booking status must always remain consistent.
- Any manual admin status change to rejected/cancelled should release seats.
- Keep payment verification endpoint mandatory before treating booking as confirmed.
