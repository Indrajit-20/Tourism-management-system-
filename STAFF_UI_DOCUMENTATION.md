# Staff & Guides/Drivers UI Documentation

## Overview

This documentation covers the new user interface components created for tour guides and bus drivers in the Tourism Management System.

## 📋 New Components & Pages Created

### 1. **StaffProfileCard Component**

**File:** `frontend/src/components/StaffProfileCard.jsx`

A beautiful card component that displays staff information with icons and organized layout.

**Features:**

- Profile avatar with designation icon (🚗 for drivers, 🎯 for guides)
- Gradient header based on role
- Contact information display
- Date of birth and address
- Member since date
- Responsive design

**Usage:**

```jsx
import StaffProfileCard from "../components/StaffProfileCard";

<StaffProfileCard staff={staffData} />;
```

---

### 2. **StaffDetailsModal Component**

**File:** `frontend/src/components/StaffDetailsModal.jsx`

Modal for viewing detailed staff information in a popup.

**Features:**

- Full staff details display
- Organized information grid
- Gradient header matching role
- Close functionality
- Beautiful styling with icons

**Usage:**

```jsx
import StaffDetailsModal from "../components/StaffDetailsModal";

const [showModal, setShowModal] = useState(false);
const [selectedStaff, setSelectedStaff] = useState(null);

<StaffDetailsModal staff={selectedStaff} onClose={() => setShowModal(false)} />;
```

---

### 3. **DriverInfoCard Component**

**File:** `frontend/src/components/DriverInfoCard.jsx`

Specialized card for displaying driver information with trip details.

**Features:**

- Driver profile with bus emoji
- Professional status badge
- Contact and license information
- Assigned trips list
- Experience and rating display
- Statistics footer

**Usage:**

```jsx
import DriverInfoCard from "../components/DriverInfoCard";

<DriverInfoCard driver={driverData} trips={upcomingTrips} totalTrips={12} />;
```

---

### 4. **GuideInfoCard Component**

**File:** `frontend/src/components/GuideInfoCard.jsx`

Specialized card for displaying tour guide information.

**Features:**

- Guide profile with target emoji
- Availability badge
- Languages spoken
- Tours completed count
- Customer ratings
- Upcoming tours list
- Specializations

**Usage:**

```jsx
import GuideInfoCard from "../components/GuideInfoCard";

<GuideInfoCard guide={guideData} tours={upcomingTours} totalTours={45} />;
```

---

### 5. **ManageGuidesAndDrivers Page**

**File:** `frontend/src/pages/ManageGuidesAndDrivers.jsx`

Admin page for managing all guides and drivers.

**Features:**

- View all staff members
- Search by name, email, or contact
- Filter by role (driver/guide)
- Statistics cards (total staff, drivers, guides)
- Add new staff member form
- View staff details
- Delete staff members
- Responsive data table
- Beautiful icons and badges

**Routes:**

```
/admin/manage-guides-drivers
```

**Key Sections:**

- Stats Cards showing total counts
- Search & Filter Section
- Staff Data Table
- Add Staff Modal
- Staff Details Modal

---

### 6. **StaffProfilePage**

**File:** `frontend/src/pages/StaffProfilePage.jsx`

Personal profile page for drivers and guides to view and edit their information.

**Features:**

- View own profile information
- Edit profile details
- Change password
- Profile card sidebar
- Form validation
- Success/error messages
- Responsive layout

**Routes:**

```
/staff-profile
```

**Sections:**

- Profile Card (read-only)
- Edit Profile Form
- Change Password Form

---

### 7. **Staff UI Styles**

**File:** `frontend/src/css/staffUI.css`

Comprehensive CSS styling for all staff UI components.

**Includes:**

- Color gradients for different roles
- Responsive design breakpoints
- Hover effects and animations
- Profile cards styling
- Tables styling
- Modal styling
- Form styling
- Button styling
- Badge styling
- Icon box styling
- Loading states

---

## 🎨 Design Features

### Color Schemes

- **Drivers:** Purple gradient (from #667eea to #764ba2)
- **Guides:** Pink/Red gradient (from #f093fb to #f5576c)
- **Primary:** Blue (#667eea)
- **Success:** Green (#84fab0)
- **Warning:** Orange/Yellow

### Responsive Breakpoints

- Desktop: Full layout
- Tablet (≤768px): Optimized spacing
- Mobile (≤576px): Stacked layout, adjusted font sizes

### Icons Used

- 🚗 Driver (car emoji)
- 🎯 Guide (target emoji)
- 📞 Phone
- 📧 Email
- 🎂 Date of Birth
- 📍 Address
- ⭐ Rating
- 📅 Date
- 🏠 Address/Location

---

## 📍 Routes Configuration

Add these to your `App.jsx`:

```jsx
// Staff Routes (for drivers and guides)
<Route element={<ProtectedRoute allowedRoles={["driver", "guide"]} />}>
  <Route path="/staff-dashboard" element={<StaffDashboard />} />
  <Route path="/staff-profile" element={<StaffProfilePage />} />
</Route>

// Admin Routes
<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
  <Route path="/admin/manage-guides-drivers" element={<ManageGuidesAndDrivers />} />
</Route>
```

---

## 🔌 API Endpoints Used

### Staff Endpoints

```
GET  /api/staff                    - Get all staff
POST /api/staff/add                - Add new staff
PUT  /api/staff/update/:id         - Update staff
PUT  /api/staff/change-password/:id - Change password
DELETE /api/staff/delete/:id       - Delete staff
```

---

## 📝 Form Fields

### Add Staff Form

- **Full Name** (required)
- **Role** (dropdown: driver/guide) (required)
- **Contact Number** (required)
- **Email** (required)
- **Password** (required)
- **Date of Birth** (format: DD-MM-YYYY) (required)
- **Address** (required)

### Edit Profile Form

- **Full Name**
- **Contact Number**
- **Email** (disabled)
- **Address**

### Change Password Form

- **Current Password**
- **New Password**
- **Confirm New Password**

---

## 🚀 How to Use

### For Admins

**1. Access the Management Page:**

- Navigate to `/admin/manage-guides-drivers`
- View all staff members

**2. Add New Staff:**

- Click "Add Staff" button
- Fill in the form with required details
- Click "Add Staff Member"

**3. View Staff Details:**

- Click the eye icon in the table
- A modal will show detailed information

**4. Delete Staff:**

- Click the delete icon
- Confirm the deletion

**5. Search/Filter:**

- Use the search box to find by name, email, or contact
- Use the filter dropdown to show only drivers or guides

### For Staff (Drivers/Guides)

**1. Access Your Profile:**

- Navigate to `/staff-profile`
- View your complete information

**2. Edit Your Information:**

- Click "Edit" button on the profile card
- Modify your details
- Click "Save Changes"

**3. Change Password:**

- Click "Change" button on password card
- Enter current password and new password
- Click "Change Password"

---

## 🎯 Styling Examples

### Stats Card

```jsx
<div className="card stats-card">
  <div className="card-body text-center">
    <h3 className="card-title">Total Staff</h3>
    <h1 className="display-4 fw-bold">25</h1>
  </div>
</div>
```

### Profile Info Box

```jsx
<div className="profile-info-box">
  <small>Contact Number</small>
  <strong>9876543210</strong>
</div>
```

### Designation Badge

```jsx
<span className="badge badge-driver">Driver</span>
<span className="badge badge-guide">Guide</span>
```

---

## 💡 Best Practices

1. **Always check authentication** before allowing access to staff pages
2. **Validate form data** before submission
3. **Show loading states** while fetching data
4. **Handle errors gracefully** with user-friendly messages
5. **Use responsive design** classes for mobile compatibility
6. **Include proper icons** for better UX
7. **Provide feedback** on successful actions

---

## 🔧 Customization Guide

### Change Colors

Edit `frontend/src/css/staffUI.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --danger-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

### Modify Icons

Update emoji in component files:

- Driver: Change 🚗 to any preferred emoji
- Guide: Change 🎯 to any preferred emoji

### Adjust Breakpoints

Edit responsive media queries in `staffUI.css`:

```css
@media (max-width: 768px) {
  /* Tablet styles */
}

@media (max-width: 576px) {
  /* Mobile styles */
}
```

---

## 📱 Mobile Optimization

All components are fully responsive:

- **Desktop:** Full multi-column layouts
- **Tablet:** Adjusted spacing and font sizes
- **Mobile:** Single-column stacked layouts
- **Touch:** Larger buttons for mobile interactions

---

## ⚠️ Important Notes

1. **Bootstrap 5** is required (already in package.json)
2. **React Icons** are used for some icons (already in package.json)
3. **Axios** is used for API calls (already in package.json)
4. **Protected routes** require proper authentication
5. **Roles required:** admin, driver, guide

---

## 🐛 Troubleshooting

### Components not rendering?

- Ensure all imports are correct
- Check that Bootstrap CSS is imported
- Verify component paths

### Styles not applying?

- Import the CSS file in your components
- Check CSS file path
- Clear browser cache

### API errors?

- Verify API endpoint URLs
- Check authentication tokens
- Ensure backend is running

---

## 📚 Additional Resources

- Bootstrap 5 Documentation: https://getbootstrap.com/
- React Documentation: https://react.dev/
- Axios Documentation: https://axios-http.com/

---

## 🎉 Summary

You now have a complete, professional staff management UI with:

- ✅ Beautiful component design
- ✅ Responsive layout
- ✅ Easy to use forms
- ✅ Comprehensive staff information display
- ✅ Search and filter capabilities
- ✅ Role-based access control
- ✅ Professional styling
- ✅ Mobile optimization

Enjoy building your staff management system! 🚀
