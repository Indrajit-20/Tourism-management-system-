# 📋 DATA DICTIONARY & SCHEMA VALIDATION

## Executive Summary ✅

**Overall Status:** 🟢 **GOOD** - Most relationships and fields are correct. Minor recommendations below.

---

## 1️⃣ BUS TICKET MODULE

### A. BusRoute Model ✅

**Purpose:** Store geographical route information only

| Field                | Type     | Required | Reference | Notes                                       |
| -------------------- | -------- | -------- | --------- | ------------------------------------------- |
| route_name           | String   | ✅       | -         | Name of route (e.g., "Ahmedabad to Rajkot") |
| boarding_state_id    | ObjectId | ❌       | State     | ✅ GOOD - Proper reference                  |
| boarding_city_id     | ObjectId | ❌       | City      | ✅ GOOD - Proper reference                  |
| boarding_from        | String   | ✅       | -         | City name for display                       |
| destination_state_id | ObjectId | ❌       | State     | ✅ GOOD - Proper reference                  |
| destination_city_id  | ObjectId | ❌       | City      | ✅ GOOD - Proper reference                  |
| destination          | String   | ✅       | -         | City name for display                       |
| status               | String   | ❌       | -         | Default: "Active"                           |

**Relationships:** ✅ CORRECT

- Routes connect to States and Cities (no driver/bus/timing data here)

**Recommendation:** None - This is clean!

---

### B. BusSchedule Model ✅

**Purpose:** Define recurring schedules with timing and pricing

| Field           | Type          | Required | Reference | Notes                                                   |
| --------------- | ------------- | -------- | --------- | ------------------------------------------------------- |
| title           | String        | ✅       | -         | Human-readable (e.g., "Ahmedabad Rajkot Morning Daily") |
| route_id        | ObjectId      | ✅       | BusRoute  | ✅ CORRECT - Links to geographic route                  |
| bus_id          | ObjectId      | ✅       | Bus       | ✅ CORRECT - Specific vehicle assigned                  |
| driver_id       | ObjectId      | ❌       | Staff     | ✅ CORRECT - Optional preferred driver                  |
| departure_time  | String        | ✅       | -         | Format: "HH:MM" (e.g., "08:00")                         |
| arrival_time    | String        | ✅       | -         | Format: "HH:MM" (e.g., "12:00")                         |
| frequency       | String        | ✅       | -         | Enum: "Daily", "Weekdays", "Weekends", "Custom"         |
| days_of_week    | Array[Number] | ❌       | -         | Used when frequency="Custom" (0-6 for days)             |
| boarding_points | Array[String] | ❌       | -         | Default pickup locations                                |
| drop_points     | Array[String] | ❌       | -         | Default dropoff locations                               |
| base_price      | Number        | ❌       | -         | Default: 0 (overridable per trip)                       |
| status          | String        | ❌       | -         | Enum: "Active", "Inactive"                              |

**Relationships:** ✅ CORRECT

```
BusSchedule → BusRoute (what route)
BusSchedule → Bus (which vehicle)
BusSchedule → Staff (optional driver)
```

**Recommendation:** None - Perfect structure!

---

### C. BusTrip Model ✅

**Purpose:** Concrete instance of a schedule on a specific date

| Field           | Type          | Required | Reference   | Notes                                                  |
| --------------- | ------------- | -------- | ----------- | ------------------------------------------------------ |
| schedule_id     | ObjectId      | ✅       | BusSchedule | ✅ CORRECT - Links to master schedule                  |
| bus_id          | ObjectId      | ❌       | Bus         | ✅ CORRECT - Specific bus for this trip                |
| driver_id       | ObjectId      | ❌       | Staff       | ✅ CORRECT - Specific driver for this trip             |
| trip_date       | Date          | ✅       | -           | Specific date (YYYY-MM-DD)                             |
| status          | String        | ❌       | -           | Enum: "Scheduled", "Running", "Completed", "Cancelled" |
| boarding_points | Array[String] | ❌       | -           | Can override schedule defaults                         |
| drop_points     | Array[String] | ❌       | -           | Can override schedule defaults                         |
| seats           | Array[Seat]   | ❌       | -           | ✅ CORRECT - Full seat layout with is_available        |

**Seat Object Structure:** ✅ CORRECT

```javascript
{
  seat_number: String (e.g., "S1", "U5", "L3"),
  row: Number,
  column: Number,
  type: String (enum: "window", "aisle", "middle", "sleeper"),
  price: Number (dynamic per seat),
  is_available: Boolean (default: true)
}
```

**Relationships:** ✅ CORRECT

```
BusTrip → BusSchedule (what's the master plan)
BusTrip → Bus (what vehicle)
BusTrip → Staff (who's driving)
```

**Recommendation:** None - Excellent!

---

### D. Bus Model ✅

**Purpose:** Store vehicle/asset information only

| Field        | Type   | Required | Reference | Notes                                           |
| ------------ | ------ | -------- | --------- | ----------------------------------------------- |
| bus_number   | String | ✅       | -         | License plate/registration (e.g., "DL01AB1234") |
| bus_name     | String | ✅       | -         | Display name (e.g., "Sunrise Express")          |
| bus_category | String | ✅       | -         | Enum: "route", "tour"                           |
| bus_type     | String | ✅       | -         | Type description (e.g., "Sleeper", "AC Seater") |
| layout_type  | String | ✅       | -         | Enum: "seater", "sleeper", "double_decker"      |
| total_seats  | Number | ✅       | -         | Total capacity                                  |
| status       | String | ❌       | -         | Default: "Active"                               |

**Relationships:** ✅ CORRECT

- No driver/route/schedule data (all moved to appropriate models)
- Pure asset representation

**Recommendation:** None - Perfect separation of concerns!

---

### E. BusTicketBooking Model ✅

**Purpose:** Track bus ticket bookings

| Field               | Type          | Required | Reference | Notes                                         |
| ------------------- | ------------- | -------- | --------- | --------------------------------------------- |
| route_id            | ObjectId      | ❌       | BusRoute  | ⚠️ LEGACY - Consider removing                 |
| trip_id             | ObjectId      | ✅       | BusTrip   | ✅ CORRECT - Links to actual trip             |
| customer_id         | ObjectId      | ✅       | Custmer   | ✅ CORRECT - Who booked                       |
| travel_date         | Date          | ✅       | -         | Date of travel                                |
| seat_numbers        | Array[String] | ✅       | -         | Booked seat IDs                               |
| seat_prices         | Array[Number] | ❌       | -         | Price per seat (matching order)               |
| travellers          | Number        | ✅       | -         | Number of passengers                          |
| price_per_seat      | Number        | ✅       | -         | Average price                                 |
| total_amount        | Number        | ✅       | -         | Total booking cost                            |
| booking_status      | String        | ✅       | -         | Enum: "Confirmed", "Completed", "Cancelled"   |
| cancellation_reason | String        | ❌       | -         | If cancelled                                  |
| payment_status      | String        | ✅       | -         | Enum: "Pending", "Paid", "Failed", "Refunded" |
| payment_deadline    | Date          | ❌       | -         | Payment deadline                              |
| payment_id          | String        | ❌       | -         | Razorpay/payment gateway ID                   |
| status              | String        | ❌       | -         | Default: "Active"                             |

**Relationships:** ✅ MOSTLY CORRECT

```
BusTicketBooking → BusTrip ✅ (which trip)
BusTicketBooking → Custmer ✅ (who booked)
BusTicketBooking → BusRoute ⚠️ (LEGACY - can derive from trip)
```

**Recommendations:**

- ⚠️ **Remove route_id** - It's redundant (can get via trip → schedule → route)
- ✅ Keep trip_id, customer_id, seat tracking

---

## 2️⃣ PACKAGE/TOUR MODULE

### A. Package Model ✅

**Purpose:** Tour package master template

| Field           | Type            | Required | Reference | Notes                                      |
| --------------- | --------------- | -------- | --------- | ------------------------------------------ |
| package_name    | String          | ✅       | -         | Package name (e.g., "Rajasthan Explorer")  |
| package_type    | String          | ✅       | -         | Type (e.g., "Heritage", "Adventure")       |
| source_city     | String          | ❌       | -         | Default: "Ahmedabad"                       |
| destination     | String          | ✅       | -         | Destination city name                      |
| state_id        | ObjectId        | ❌       | State     | ✅ NEW - Good!                             |
| city_id         | ObjectId        | ❌       | City      | ✅ NEW - Good!                             |
| places_visited  | Array[ObjectId] | ❌       | City      | ✅ NEW - Good!                             |
| hotels          | Array[ObjectId] | ❌       | Hotel     | ✅ GOOD - Multiple hotels                  |
| price           | Number          | ❌       | -         | ⚠️ DEPRECATED - Use TourSchedule.price     |
| duration        | String          | ✅       | -         | Trip duration (e.g., "3 days", "5 nights") |
| image_urls      | Array[String]   | ❌       | -         | Package images                             |
| description     | String          | ❌       | -         | Package description                        |
| tour_guide      | ObjectId        | ❌       | Staff     | ✅ GOOD - Optional guide                   |
| inclusive       | String          | ❌       | -         | What's included                            |
| exclusive       | String          | ❌       | -         | What's not included                        |
| boarding_points | Array[String]   | ❌       | -         | Pickup locations                           |
| pickup_points   | Array[String]   | ❌       | -         | ⚠️ LEGACY - Use boarding_points            |
| sightseeing     | Array[String]   | ❌       | -         | Attractions                                |
| itinerary       | String          | ❌       | -         | Detailed day-by-day plan                   |
| status          | String          | ❌       | -         | Default: "Active"                          |

**Relationships:** ✅ MOSTLY CORRECT

```
Package → State ✅ (location)
Package → City ✅ (destination)
Package → City[] ✅ (places_visited)
Package → Hotel[] ✅ (accommodations)
Package → Staff ✅ (tour_guide optional)
```

**Recommendations:**

- ✅ **state_id, city_id, places_visited are good!**
- ⚠️ Remove or deprecate `price` field (use TourSchedule.price instead)
- ⚠️ Consolidate: Use only `boarding_points`, remove `pickup_points`

---

### B. TourSchedule Model ✅

**Purpose:** Specific departure date for a package

| Field            | Type        | Required | Reference | Notes                          |
| ---------------- | ----------- | -------- | --------- | ------------------------------ |
| package_id       | ObjectId    | ✅       | Package   | ✅ CORRECT                     |
| start_date       | Date        | ✅       | -         | Tour start date                |
| end_date         | Date        | ❌       | -         | Tour end date                  |
| departure_time   | String      | ❌       | -         | Time of day departure          |
| bus_id           | ObjectId    | ✅       | Bus       | ✅ CORRECT                     |
| driver_id        | ObjectId    | ❌       | Staff     | ✅ CORRECT                     |
| guide_id         | ObjectId    | ❌       | Staff     | ✅ CORRECT - Tour guide        |
| price            | Number      | ❌       | -         | ✅ GOOD - Per-schedule pricing |
| price_per_person | Number      | ❌       | -         | ⚠️ LEGACY - Same as price      |
| total_seats      | Number      | ✅       | -         | Bus capacity                   |
| available_seats  | Number      | ✅       | -         | Remaining seats                |
| seats            | Array[Seat] | ❌       | -         | ✅ GOOD - Seat layout          |

**Relationships:** ✅ CORRECT

```
TourSchedule → Package ✅ (which tour)
TourSchedule → Bus ✅ (which vehicle)
TourSchedule → Staff[driver] ✅ (who drives)
TourSchedule → Staff[guide] ✅ (who guides)
```

**Recommendations:**

- ⚠️ Remove `price_per_person` - Keep only `price`

---

### C. PackageBooking Model ✅

**Purpose:** Track tour package bookings

| Field              | Type          | Required | Reference    | Notes                                |
| ------------------ | ------------- | -------- | ------------ | ------------------------------------ |
| Package_id         | ObjectId      | ✅       | Package      | ✅ CORRECT                           |
| tour_schedule_id   | ObjectId      | ❌       | TourSchedule | ✅ CORRECT                           |
| Custmer_id         | ObjectId      | ✅       | Custmer      | ✅ CORRECT                           |
| travellers         | Number        | ❌       | -            | Number of passengers                 |
| seat_numbers       | Array[String] | ❌       | -            | Selected seats                       |
| pickup_location    | String        | ❌       | -            | Chosen pickup point                  |
| seat_price_details | Array         | ❌       | -            | ✅ GOOD - Per-seat breakdown         |
| price_per_person   | Number        | ✅       | -            | Price per traveler                   |
| total_amount       | Number        | ❌       | -            | Total cost                           |
| booking_date       | Date          | ❌       | -            | When booked                          |
| other_travelers    | Array[String] | ❌       | -            | ⚠️ LEGACY                            |
| booking_status     | String        | ✅       | -            | pending/approved/confirmed/cancelled |
| payment_status     | String        | ✅       | -            | Pending/Paid/Failed/Refunded         |
| payment_deadline   | Date          | ❌       | -            | 24hr after approval                  |
| payment_id         | String        | ❌       | -            | Razorpay ID                          |
| status             | String        | ❌       | -            | Active/Inactive                      |

**Relationships:** ✅ CORRECT

```
PackageBooking → Package ✅
PackageBooking → TourSchedule ✅
PackageBooking → Custmer ✅
```

**⚠️ NOTE:** Field naming inconsistency: `Custmer_id` vs `Package_id` (capital letters)

- Recommendation: Use snake_case for consistency

---

## 3️⃣ SUPPORT MODELS

### A. Staff Model ✅

**Purpose:** Store employees (drivers, guides, etc.)

| Field           | Type   | Required | Reference | Notes                      |
| --------------- | ------ | -------- | --------- | -------------------------- |
| name            | String | ✅       | -         | Full name                  |
| designation     | String | ✅       | -         | Enum: "driver", "guide"    |
| contact_no      | String | ✅       | -         | Phone number               |
| email_id        | String | ✅       | -         | Email (unique)             |
| password        | String | ✅       | -         | Hashed password            |
| dob             | String | ✅       | -         | Format: DD-MM-YYYY         |
| address         | String | ✅       | -         | Address                    |
| driver_license  | String | ❌       | -         | ✅ GOOD - License number   |
| date_of_joining | String | ❌       | -         | ✅ GOOD - Joining date     |
| experience      | String | ❌       | -         | ✅ GOOD - Experience level |

**Relationships:** ✅ CORRECT

- No unnecessary references
- Driver qualifications properly tracked

**Recommendations:**

- ✅ Looks good! New fields are properly added.

---

### B. City Model ✅

**Purpose:** Geographic locations

| Field       | Type     | Required | Reference | Notes                              |
| ----------- | -------- | -------- | --------- | ---------------------------------- |
| city_name   | String   | ✅       | -         | City name                          |
| state_id    | ObjectId | ❌       | State     | ✅ GOOD - No duplicate state field |
| description | String   | ❌       | -         | City description                   |

**Relationships:** ✅ CORRECT

```
City → State ✅ (which state)
```

**Recommendations:**

- ✅ Perfect! Removed redundant state string field.

---

### C. State Model ✅

**Purpose:** States/provinces

| Field      | Type   | Required | Reference | Notes                      |
| ---------- | ------ | -------- | --------- | -------------------------- |
| state_name | String | ✅       | -         | State name (unique)        |
| status     | String | ❌       | -         | Enum: "Active", "Inactive" |

**Relationships:** ✅ CORRECT

- Standalone reference model

**Recommendations:** None - Perfect!

---

### D. Hotel Model ✅

**Purpose:** Hotel/accommodation information

| Field       | Type     | Required | Reference | Notes                           |
| ----------- | -------- | -------- | --------- | ------------------------------- |
| name        | String   | ✅       | -         | Hotel name                      |
| city_id     | ObjectId | ✅       | City      | ✅ CORRECT                      |
| state_id    | ObjectId | ✅       | State     | ✅ CORRECT                      |
| location    | String   | ✅       | -         | Address/location                |
| hotel_type  | String   | ❌       | -         | Type (e.g., "5-star", "Budget") |
| description | String   | ❌       | -         | Hotel description               |
| status      | String   | ❌       | -         | Enum: "Active", "Inactive"      |

**Relationships:** ✅ CORRECT

```
Hotel → City ✅
Hotel → State ✅
```

**Recommendations:** None - Good!

---

### E. Custmer Model ✅

**Purpose:** Customer/user account information

| Field      | Type   | Required | Reference | Notes                           |
| ---------- | ------ | -------- | --------- | ------------------------------- |
| first_name | String | ✅       | -         | First name                      |
| last_name  | String | ✅       | -         | Last name                       |
| email      | String | ✅       | -         | Email (unique)                  |
| dob        | String | ✅       | -         | Format: DD-MM-YYYY              |
| phone_no   | Number | ✅       | -         | Phone (unique)                  |
| password   | String | ✅       | -         | Hashed password                 |
| gender     | String | ❌       | -         | Enum: "Male", "Female", "Other" |
| address    | String | ❌       | -         | Address                         |

**Relationships:** ✅ CORRECT

- No unnecessary references
- Standalone user model

**Recommendations:** None - Good!

---

## 📊 RELATIONSHIP DIAGRAM

```
STATE
  ├─ City (state_id → State._id) ✅
  ├─ BusRoute (boarding_state_id → State._id) ✅
  ├─ BusRoute (destination_state_id → State._id) ✅
  └─ Hotel (state_id → State._id) ✅

CITY
  ├─ State (state_id → State._id) ✅
  ├─ BusRoute (boarding_city_id → City._id) ✅
  ├─ BusRoute (destination_city_id → City._id) ✅
  ├─ Package (city_id → City._id) ✅
  ├─ Package (places_visited[] → City._id) ✅
  └─ Hotel (city_id → City._id) ✅

BUS
  ├─ BusSchedule (bus_id → Bus._id) ✅
  ├─ BusTrip (bus_id → Bus._id) ✅
  └─ TourSchedule (bus_id → Bus._id) ✅

BUSROUTE
  ├─ BusSchedule (route_id → BusRoute._id) ✅
  └─ BusTicketBooking (route_id → BusRoute._id) ⚠️ LEGACY

BUSSCHEDULE
  ├─ BusTrip (schedule_id → BusSchedule._id) ✅
  └─ BusRoute (route_id → BusRoute._id) ✅

BUSTIP
  ├─ BusSchedule (schedule_id → BusSchedule._id) ✅
  ├─ Bus (bus_id → Bus._id) ✅
  ├─ Staff (driver_id → Staff._id) ✅
  └─ BusTicketBooking (trip_id → BusTrip._id) ✅

STAFF
  ├─ BusSchedule (driver_id → Staff._id) ✅
  ├─ BusTrip (driver_id → Staff._id) ✅
  ├─ Package (tour_guide → Staff._id) ✅
  └─ TourSchedule (driver_id, guide_id → Staff._id) ✅

PACKAGE
  ├─ State (state_id → State._id) ✅
  ├─ City (city_id → City._id) ✅
  ├─ City (places_visited[] → City._id) ✅
  ├─ Hotel (hotels[] → Hotel._id) ✅
  ├─ Staff (tour_guide → Staff._id) ✅
  └─ PackageBooking (Package_id → Package._id) ✅

TOURSCHEDULE
  ├─ Package (package_id → Package._id) ✅
  ├─ Bus (bus_id → Bus._id) ✅
  ├─ Staff (driver_id → Staff._id) ✅
  ├─ Staff (guide_id → Staff._id) ✅
  └─ PackageBooking (tour_schedule_id → TourSchedule._id) ✅

CUSTMER
  ├─ BusTicketBooking (customer_id → Custmer._id) ✅
  └─ PackageBooking (Custmer_id → Custmer._id) ✅
```

---

## 🎯 FINAL RECOMMENDATIONS

### ✅ EXCELLENT - No Changes Needed:

1. ✅ BusRoute - Pure geography (no drivers/buses/timing)
2. ✅ BusSchedule - Proper references to Route, Bus, Staff
3. ✅ BusTrip - Correct concrete instance model
4. ✅ Bus - Pure asset (no drivers attached)
5. ✅ Staff - Proper driver/guide fields (driver_license, date_of_joining, experience)
6. ✅ City - State reference only (no duplicate state field)
7. ✅ State - Simple master data
8. ✅ Hotel - Proper city/state references
9. ✅ Custmer - Standalone user model
10. ✅ Package - Now has state_id, city_id, places_visited
11. ✅ TourSchedule - Proper references to package, bus, staff
12. ✅ PackageBooking - Links to package, tour schedule, customer

### ⚠️ MINOR IMPROVEMENTS - Consider These:

| Issue                | Model            | Action                               | Reason                                  |
| -------------------- | ---------------- | ------------------------------------ | --------------------------------------- |
| Redundant field      | BusTicketBooking | Remove `route_id`                    | Can derive from trip → schedule → route |
| Deprecated field     | Package          | Remove `price`                       | Use TourSchedule.price instead          |
| Deprecated field     | Package          | Remove `pickup_points`               | Use only `boarding_points`              |
| Deprecated field     | TourSchedule     | Remove `price_per_person`            | Use `price` only                        |
| Naming inconsistency | PackageBooking   | Change `Package_id` to `package_id`  | Use snake_case throughout               |
| Naming inconsistency | PackageBooking   | Change `Custmer_id` to `customer_id` | Use snake_case throughout               |

### 🚀 READY FOR PRODUCTION:

Yes! The data structure is production-ready. The recommendations above are minor cleanups that can be done gradually.

---

## 📝 SUMMARY FOR YOUR PRESENTATION TOMORROW:

**All relationships and reference keys are GOOD! ✅**

**Key Improvements Made:**

- ✅ Package now references State and City (no duplication)
- ✅ Bus is pure vehicle asset (no drivers stored in Bus model)
- ✅ City references only State (no duplicate state field)
- ✅ Staff has driver-specific fields (license, joining date, experience)
- ✅ Proper 1-to-Many and Many-to-Many relationships throughout

**Data Integrity:** All references use MongoDB ObjectId with proper ref strings
**No Circular References:** ✅ Clean hierarchy
**Proper Indexing:** Can add `unique: true` to email/phone fields if needed

You're ready to demo! 🎉
