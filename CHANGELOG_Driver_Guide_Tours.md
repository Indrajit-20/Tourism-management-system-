# Driver & Tour Guide Assignment Updates for Tour Packages

This document explains the changes that were made to allow assigning specific **Drivers** and **Tour Guides** to individual **Tour Schedules** (specific departure dates), rather than attaching them permanently to the Package template.

### 1. Backend Models

**File Changed:** `backend/models/TourSchedule.js`

Added `driver_id` and `guide_id` fields to link directly to the `Staff` collection. This allows different drivers and guides to handle different dates for the same package.

```javascript
// Driver assigned to this specific tour run
driver_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Staff",
},

// Tour guide assigned to this specific tour run
guide_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Staff",
},
```

### 2. Backend Controllers

**File Changed:** `backend/controllers/tourScheduleController.js`

- **Create Schedule (`createTourDeparture`)**: Reads `driver_id` and `guide_id` from the request body and saves them when creating a new schedule.
- **Update Schedule (`updateTourDeparture`)**: Allows the Admin to update/change the `driver_id` and `guide_id` if the schedule is still in `Draft` or `Open` status.
- **Fetch Schedules (`getPackageDepartures`, `getAllDepartures`)**: Populates the staff details so the frontend can display their names and contact numbers.

```javascript
.populate("driver_id", "name contact_no")
.populate("guide_id", "name contact_no")
```

### 3. Frontend UI (Admin Panel)

**File Changed:** `frontend/src/components/ManageTourSchedules.jsx`

- **Data Fetching**: Added an API call (`fetchStaff()`) to get all registered staff members when the component loads.
- **Form State**: Expanded `formData` to hold `driver_id` and `guide_id`.
- **UI Dropdowns**: Added simple Bootstrap `<select>` dropdowns to the "Create/Edit Schedule" form, separately filtering staff by their roles:
  - `staff.filter(s => s.designation === "driver")`
  - `staff.filter(s => s.designation === "guide")`
- **Schedule List View**: Updated the info cards that show created Schedules. They now display the specifically assigned driver and guide.

```jsx
<div className="mb-2">
  <small className="text-muted">🧑‍✈️ Driver:</small>
  <strong> {dep.driver_id?.name || "Not assigned"}</strong>
</div>

<div className="mb-2">
  <small className="text-muted">🧭 Guide:</small>
  <strong> {dep.guide_id?.name || "Not assigned"}</strong>
</div>
```

### Summary of Benefits

- **No Conflicts**: A driver can now be scheduled for a 5-day tour, return, and be assigned to a different tour immediately after.
- **Logical Workflow**: The Package acts purely as a "Template" (e.g., 3 Days Goa). The Schedule acts as the "Actual Event" (e.g., Jan 1 to Jan 3, Bus #101, Driver: Ramesh, Guide: Suresh).
- **Ready for Dashboard**: These changes now allow us to accurately fetch data for the Driver & Tour Guide personal dashboards based on the upcoming date schedules assigned directly to them!
