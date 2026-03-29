# Package Module Visual Flows (Final)

This file documents the final Tour Package flow with:

- approval-first payment
- booking and payment notifications
- cancellation and refund policy
- auto lifecycle updates
- review linkage to package master

---

## 1. User Booking Flow (Visual)

```text
User opens Packages list
  -> selects Package Master
  -> sees package details + Open/Locked departures
  -> selects one departure
  -> selects seats (white available, red booked, green selected)
  -> fills passenger data
      Lead passenger: name, age, gender, aadhaar_number, aadhaar_photo
      Other passengers: name, age, gender
  -> selects pickup location (from package boarding points)
  -> sees summary amount
  -> submits booking
  -> booking_status = pending
  -> approval_deadline = now + 48h
  -> seats reserved immediately
  -> Notification: Booking submitted! Waiting for admin approval.
```

---

## 2. Admin Approval + Payment Flow

```text
Admin opens Tour Booking Requests
  -> views pending bookings
  -> Approve OR Reject

If Approve:
  -> booking_status = approved
  -> payment_deadline = now + 24h
  -> Notification: Booking approved! Pay within 24 hours.
  -> user sees Pay Now in My Bookings

User clicks Pay Now
  -> Razorpay opens
  -> payment success callback
  -> backend confirms payment
  -> payment_status = paid
  -> booking_status = confirmed
  -> Notification: Payment successful! Booking confirmed.

Important rule:
  Payment is allowed only after approval.
```

---

## 3. Auto Deadline Flows (Cron)

### 3.1 Auto Reject Pending After 48h

```text
Every hour:
  if booking_status = pending AND approval_deadline expired
    -> booking_status = rejected
    -> admin_note = Auto rejected - not reviewed within 48 hours
    -> release reserved seats
    -> Notification: Booking expired - not reviewed in time. Please try again.
```

### 3.2 Auto Cancel Approved Unpaid After 24h

```text
Every hour:
  if booking_status = approved AND payment_deadline expired
    -> booking_status = cancelled
    -> release reserved seats
    -> Notification: Payment deadline passed. Booking cancelled.
```

### 3.3 Auto Complete After Travel Date

```text
Scheduled maintenance:
  if booking_status = confirmed AND departure date passed
    -> booking_status = completed
    -> Notification: Trip completed! Write a review.
```

---

## 4. Seat Management Flow

```text
Booking submitted (pending)
  -> selected seats set is_booked = true
  -> booked_by = booking_id
  -> available_seats recalculated

Booking rejected / auto-rejected / cancelled
  -> those seats released
  -> is_booked = false
  -> booked_by = null
  -> available_seats recalculated

Booking confirmed + paid
  -> seats remain booked
```

---

## 5. Departure Status and Locking

```text
Departure Draft
  -> admin prepares date/price/bus

Departure Open
  -> visible for booking

First successful booking from Open
  -> departure_status = Locked

Locked rules:
  -> cannot edit date, bus, or price
  -> can still edit notes/content fields

If no seats left
  -> departure_status = BookingFull

After travel
  -> departure_status = Completed
```

---

## 6. Cancellation and Refund Visual Policy

### 6.1 Allowed / Not Allowed

```text
pending   -> can cancel
approved  -> can cancel
confirmed -> can cancel with slab policy
completed -> cannot cancel
cancelled -> cannot cancel again
```

### 6.2 Confirmed Refund Slabs

```text
15+ days before travel  -> 100% refund
7-14 days              -> 80% refund
3-6 days               -> 60% refund
0-2 days               -> 40% refund
after travel date      -> cancellation blocked
```

### 6.3 Mandatory Preview Before Confirm

```text
Before cancellation confirmation, show:
  - Amount paid
  - Refund amount
  - Non-refundable amount
Then ask user confirmation.
```

### 6.4 Admin Cancellation Rule

```text
If admin cancels booking:
  -> 100% refund policy
```

---

## 7. Review Flow (Package Master Linked)

```text
Only completed booking can submit review
  -> one review per booking
  -> set booking.review_submitted = true
  -> set booking.feedback_id / review_id

Review links:
  package_id  = Package Master ID
  departure_id = travelled departure
  booking_id   = booking used for validation

Package page review list:
  -> shows all reviews from all departures under same package_id
```

---

## 8. Booking Validations (Checklist)

### Admin Schedule (Create/Update)

- start date must be at least 3 days from today
- start date in past is blocked
- end date cannot be earlier than start date
- price must be greater than 0
- date comparison uses day-level logic (no time-of-day confusion)

### Date

- travel date must be future
- booking at least 3 days before departure
- not more than 6 months ahead
- date comparison uses day-level logic (today is not treated as future)

### Seat

- no already-booked seats
- passenger count = selected seat count
- max 10 persons per booking

### Aadhaar (Lead Passenger)

- exactly 12 digits, numeric
- Aadhaar photo required (JPG/PNG, max 2MB)

### Pickup

- must be selected from package boarding points

### Duplicate

- same customer cannot have another active booking for same departure
  (pending/approved/confirmed)

### Departure Status

- only Open or Locked are bookable

---

## 9. Key APIs Used in This Flow

### Packages / Departures

- GET /api/packages
- GET /api/packages/:id
- GET /api/packages/:package_id/departures
- GET /api/departures/:id
- GET /api/departures/:id/seats

### Booking

- POST /api/bookings/book
- GET /api/bookings/my-bookings
- PUT /api/bookings/update-status/:id (admin)
- POST /api/bookings/confirm-payment

### Cancellation

- POST /api/cancellation/preview
- POST /api/cancellation/cancel

### Review

- POST /api/feedback/submit
- GET /api/packages/:package_id/reviews

### Notifications

- GET /api/notifications/my
- PUT /api/notifications/:id/read
- PUT /api/notifications/mark-all-read

---

## 10. Quick QA Scenarios

1. Submit booking with valid lead Aadhaar + photo -> pending + notification.
2. Admin approve -> approved + payment deadline + notification.
3. Attempt payment before approval -> blocked.
4. Pay after approval -> confirmed/paid + notification.
5. Let approved booking expire -> auto-cancel + seats released + notification.
6. Let pending booking expire -> auto-reject + seats released + notification.
7. Cancel confirmed booking at 10 days -> 80% refund preview shown.
8. Cancel confirmed booking at 2 days -> 40% refund preview shown.
9. After completion, submit one review -> success.
10. Submit second review for same booking -> blocked.
11. Admin creates departure for today -> blocked (minimum 3 days required).
12. Admin creates or updates departure with past date -> blocked.
