# 🚌 BusSchedule vs 🎫 TourSchedule - CLEAR SEPARATION

This document ensures that Bus Routes and Tour Packages NEVER mix.

---

## System Comparison

| Feature            | BusSchedule             | TourSchedule            |
| ------------------ | ----------------------- | ----------------------- |
| **Purpose**        | City-to-city bus routes | Multi-day tour packages |
| **Duration**       | 2-8 hours (point A → B) | 3-7 days (with hotels)  |
| **Accommodation**  | None (travel only)      | Includes hotels         |
| **Attractions**    | Just transport          | Includes sightseeing    |
| **Booking Type**   | Bus ticket              | Tour package booking    |
| **Max Passengers** | Full bus                | Usually smaller groups  |

---

## Database Models (NEVER MIX)

### ❌ DON'T DO THIS:

```javascript
// WRONG - mixing both:
const booking = {
  bus_schedule_id: "...", // ❌ Bus trip schedule
  tour_schedule_id: "...", // ❌ Tour departure
};
```

### ✅ DO THIS INSTEAD:

**For Bus Booking:**

```javascript
const BusTicketBooking = {
  trip_id: ObjectId → BusTrip → BusSchedule,  // Bus system chain
  // NEVER has: tour_schedule_id, hotels, Package_id
};
```

**For Tour Booking:**

```javascript
const PackageBooking = {
  tour_schedule_id: ObjectId → TourSchedule → Package,  // Tour system chain
  // NEVER has: trip_id, bus_schedule_id, BusRoute_id
};
```

---

## API Endpoints (SEPARATE NAMESPACES)

### 🚌 BUS SYSTEM (`/api/bus-*`)

```http
GET    /api/bus-routes                    → List all routes (Ahmedabad → Rajkot, etc.)
GET    /api/bus-schedules                 → Recurring schedules per route
GET    /api/bus-trips                     → Individual trip instances (specific dates)
POST   /api/bus-bookings/book             → Book bus ticket
GET    /api/bus-bookings/my-bookings      → My bus tickets
GET    /api/bus-bookings/seats            → Get booked seats for a trip
```

**Example Request: Book Bus Ticket**

```bash
POST /api/bus-bookings/book
{
  "trip_id": "65abc...",        # Links to BusTrip
  "seat_numbers": ["S1", "S2"]
}
```

---

### 🎫 TOUR SYSTEM (`/api/tour-*`, `/api/bookings`, `/api/packages`)

```http
GET    /api/packages                          → List all tour packages
GET    /api/tour-schedules/package/:id/departures → Get departures for package
POST   /api/tour-schedules                    → Create new departure (admin)
POST   /api/bookings/book                     → Book tour package
GET    /api/bookings/my-bookings              → My tour bookings
GET    /api/tour-schedules/:id/seats          → Get booked seats for departure
```

**Example Request: Book Tour Package**

```bash
POST /api/bookings/book
{
  "package_id": "63def...",           # Links to Package Master
  "tour_schedule_id": "65ghi...",     # Links to TourSchedule
  "seat_numbers": ["S1", "S2"]
}
```

---

## Backend Models Structure

### 🚌 BUS CHAIN:

```
BusRoute (template)
  ↓
BusSchedule (recurring schedule)
  ↓
BusTrip (one specific date)
  ↓
BusTicketBooking (customer books seats)
```

**File Locations:**

- Models: `backend/models/BusRoute.js`, `BusSchedule.js`, `BusTrip.js`, `BusTicketBooking.js`
- Controller: `backend/controllers/busTripController.js`, `busBookingController.js`
- Routes: `backend/routes/busTripRoutes.js`, `busBookingRoutes.js`

---

### 🎫 TOUR CHAIN:

```
Package (master template)
  ↓
TourSchedule (individual departure)
  ↓
PackageBooking (customer books tour)
  ↓
Feedback (review on Package Master, visible across all departures)
```

**File Locations:**

- Models: `backend/models/Package.js`, `TourSchedule.js`, `PackageBooking.js`
- Controller: `backend/controllers/tourScheduleController.js`, `tourbookingController.js`
- Routes: `backend/routes/tourScheduleRoutes.js`, `tourbookingRoutes.js`

---

## Frontend Components (SEPARATE BY TYPE)

### 🚌 BUS COMPONENTS:

```
src/pages/
  ├─ BookBus.jsx                    # Select route & date (calls /api/bus-routes, /api/bus-schedules)
  ├─ ManageSchedules.jsx            # Admin: manage /api/bus-schedules

src/components/
  ├─ BusLayout.jsx                  # Seat map for buses
```

### 🎫 TOUR COMPONENTS:

```
src/pages/
  ├─ PackageSeatSelection.jsx       # Select tour departure & seats (calls /api/tour-schedules)
  ├─ BookPackage.jsx                # Fill passenger details

src/components/
  ├─ TourDepartureSelector.jsx      # Select tour departure (calls /api/tour-schedules)
  ├─ ManageTourSchedules.jsx        # Admin: manage /api/tour-schedules
```

---

## ✅ VALIDATION CHECKLIST

Use this when adding new features:

- [ ] Am I using `/api/bus-*` endpoints? → It's BUS system
- [ ] Am I using `/api/tour-schedules` or `/api/bookings`? → It's TOUR system
- [ ] BusTicketBooking should NEVER have `tour_schedule_id` ✗
- [ ] PackageBooking should NEVER have `trip_id` ✗
- [ ] BusLayout component shows bus seats ✓
- [ ] TourDepartureSelector shows tour departures ✓
- [ ] Don't mix hotel/sightseeing info into bus bookings ✗
- [ ] Don't mix multi-day logic into bus trips ✗

---

## 🚫 COMMON MISTAKES TO AVOID

### ❌ WRONG - Mixing both services:

```javascript
// Frontend
const booking = {
  ...busBookingData,
  tour_schedule_id, // ❌ Don't mix!
  hotels, // ❌ Don't mix!
};
```

### ✅ RIGHT - Keep them separate:

```javascript
// Frontend - Bus booking
const busBooking = axios.post("/api/bus-bookings/book", { trip_id, seats });

// Frontend - Tour booking (separate API call)
const tourBooking = axios.post("/api/bookings/book", {
  tour_schedule_id,
  passengers,
});
```

---

## Quote from Architecture Guide:

> "Package Master (tour template) → has many TourSchedules (departures)  
> TourSchedule (specific departure) → has many PackageBookings (customer bookings)
>
> BusRoute (road template) → has many BusSchedules (recurring plans)  
> BusSchedule → has many BusTrips (instances)  
> BusTrip → has many BusTicketBookings (customer seats)
>
> **THESE TWO CHAINS ARE COMPLETELY INDEPENDENT**"

---

## Summary

**Tour Package System:**  
User buys a complete experience (hotels + activities + transport)  
Booked via `/api/bookings/book` with `tour_schedule_id`

**Bus Ticket System:**  
User buys transport only (point A → point B)  
Booked via `/api/bus-bookings/book` with `trip_id`

**They share nothing except the user!**
