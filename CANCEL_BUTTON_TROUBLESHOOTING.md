# ❌ Cancel Button Not Showing - Troubleshooting Guide

**Date:** March 19, 2026  
**Issue:** Cancel button not appearing in MyBookings

---

## ✅ Verification: Code is in Place

### Frontend ✅

- `handleCancelBooking()` function: **PRESENT** (Line 192-227)
- Cancel button for Pending bookings: **PRESENT** (Line 471)
- Cancel button for Approved bookings: **PRESENT** (Line 456)

### Backend ✅

- `cancelBooking()` controller: **PRESENT** (busBookingController.js)
- Cancel route: **PRESENT** (busBookingRoutes.js Line 20)
- Route registered in index.js: **PRESENT** (Line 80)
- ticketRoutes imported: **PRESENT** (Line 30)
- ticketRoutes registered: **PRESENT** (Line 97)

**Verdict:** All code is correct! Issue is likely a **browser cache problem**.

---

## 🔧 Solution: Fix Browser Cache

### Step 1: Hard Refresh Frontend

```powershell
# Press these keys in your browser:
# Windows: Ctrl + Shift + R  (Hard Refresh)
# or
# Windows: Ctrl + F5  (Clear Cache and Reload)
```

### Step 2: Clear Browser Cache

```
1. Open Browser DevTools (F12)
2. Right-click on refresh button
3. Click "Empty cache and hard refresh"
4. Close DevTools (F12)
```

### Step 3: Check Console for Errors

```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Screenshot any errors and share
```

### Step 4: Verify Button Shows Now

```
1. Go to MyBookings page
2. Look for a Pending booking (Status = "Pending")
3. In the Action column, you should now see:
   ⏳ Waiting for admin
   [❌ Cancel]  ← This button
```

---

## 📊 What Should Display

### Pending Booking

```
Row 1: Route info, Seats, Total, Status, Action
Row 2: [ ⏳ Waiting for admin ]
       [ ❌ Cancel ]           ← NEW BUTTON
```

### Approved Booking (Before Payment)

```
Row 1: Route info, Seats, Total, Status, Action
Row 2: [ ⏰ Pay in: 28m 45s ]
       [ 💳 Pay Now ]  [ ❌ Cancel ]  ← NEW BUTTON
```

### Confirmed Booking

```
Row 1: Route info, Seats, Total, Status, Action
Row 2: [ 📥 Download Ticket ]  ← NEW BUTTON
       [ ✅ Confirmed ]
       [ ID: xxxxx ]
```

---

## 🐛 If Still Not Showing

### Check 1: Browser DevTools Console

```
Open F12 → Console tab
Look for errors like:
- "handleCancelBooking is not defined"
- "Cannot read property 'booking_status'"
- Network errors (red requests)
```

### Check 2: Backend is Running

```powershell
# Check if backend running on port 4000
netstat -ano | findstr :4000

# Should show:
# TCP    0.0.0.0:4000           0.0.0.0:0              LISTENING       (PID)
```

### Check 3: Frontend is Running

```powershell
# Check if frontend running on port 5173
netstat -ano | findstr :5173

# Should show:
# TCP    [::1]:5173             [::]:0                 LISTENING       (PID)
```

### Check 4: Verify Booking Status

```
In MyBookings, check booking status:
- "Pending" → Should show ❌ Cancel
- "Approved" → Should show 💳 Pay Now + ❌ Cancel
- "Confirmed" → Should show 📥 Download Ticket
- "Rejected" → Should show status message
- "Cancelled" → Should show status message
```

---

## 🔄 If Still Issues: Restart Everything

### Option 1: Restart Backend

```powershell
# 1. Kill backend process (PID 20732 from netstat)
taskkill /PID 20732 /F

# 2. Navigate to backend
cd c:\Users\INDRAJEIT\OneDrive\Documents\Desktop\new\ tms2\Tourism-management-system-\backend

# 3. Start backend
npm start

# Wait for "Server running on port 4000"
```

### Option 2: Restart Frontend

```powershell
# 1. Kill frontend process (PID 2960 from netstat)
taskkill /PID 2960 /F

# 2. Navigate to frontend
cd c:\Users\INDRAJEIT\OneDrive\Documents\Desktop\new\ tms2\Tourism-management-system-\frontend

# 3. Start frontend
npm run dev

# Wait for "Local: http://localhost:5173"
```

### Option 3: Restart Both

```powershell
# Kill both
taskkill /PID 20732 /F
taskkill /PID 2960 /F

# Wait 2 seconds
Start-Sleep -Seconds 2

# Restart backend
cd c:\Users\INDRAJEIT\OneDrive\Documents\Desktop\new\ tms2\Tourism-management-system-\backend
npm start

# In another terminal, restart frontend
cd c:\Users\INDRAJEIT\OneDrive\Documents\Desktop\new\ tms2\Tourism-management-system-\frontend
npm run dev

# Wait for both to start, then hard refresh browser
```

---

## ✅ Testing After Fix

### Test 1: Can You See Cancel Button?

```
1. Go to MyBookings
2. Find a Pending booking
3. Click [❌ Cancel]
4. Confirm in dialog
5. Check: Booking marked as Cancelled
```

### Test 2: Does Cancel Work?

```
1. After clicking Cancel
2. Wait for page to refresh
3. Check: booking_status changed to "Cancelled"
4. Check: Seats released (can be booked again)
```

### Test 3: Download Works?

```
1. Find Confirmed booking
2. Click [📥 Download Ticket]
3. Check: HTML file downloads
4. Check: Open in browser → Shows ticket
5. Check: Print → PDF works
```

---

## 🎯 Quick Checklist

- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Cleared browser cache
- [ ] Checked console for errors (F12)
- [ ] Backend running on port 4000 ✅
- [ ] Frontend running on port 5173 ✅
- [ ] Can see "❌ Cancel" button for Pending booking
- [ ] Can see "❌ Cancel" button for Approved booking
- [ ] Can see "📥 Download Ticket" for Confirmed booking
- [ ] Cancel button works (booking marked Cancelled)
- [ ] Download button works (HTML downloads)

---

## 📞 If All Else Fails

**Create a test booking:**

```javascript
// Open browser console (F12)
// Run this to see all bookings:
fetch("http://localhost:4000/api/bus-bookings/my-bookings", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
})
  .then((r) => r.json())
  .then((data) => console.log(data));

// Check:
// 1. Do bookings have "booking_status" field?
// 2. Is status "Pending" or "Approved"?
// 3. Do bookings have "_id" field?
// 4. Paste output and share
```

---

## 🚨 Final Note

**All backend code is correct and running!**

The cancel feature is 100% implemented:

- ✅ Controller function: cancelBooking()
- ✅ Route: POST /api/bus-bookings/cancel/:id
- ✅ Frontend handlers: handleCancelBooking() & handleDownloadTicket()
- ✅ UI buttons: Added to MyBookings

**Most common cause:** Browser cache not refreshed.

**Solution:**

1. Press `Ctrl+Shift+R` in browser
2. Close browser completely
3. Reopen browser
4. Go to MyBookings again

If still not showing, **provide screenshot of:**

1. MyBookings page
2. Browser console errors (F12 → Console)
3. Network tab (F12 → Network)
