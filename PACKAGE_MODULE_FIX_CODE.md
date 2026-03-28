# 🔧 PACKAGE MODULE - FIX CODE EXAMPLES

## 1️⃣ FIX: Enable Tour Status Auto-Update

### File: `backend/index.js`

Add this to enable auto-update via cron job:

```javascript
// At the top of index.js
const cron = require("node-cron");
const { autoUpdateTourStatuses } = require("./controllers/packageController");

// ... existing code ...

// Schedule tour status auto-update every hour
cron.schedule("0 * * * *", async () => {
  try {
    console.log("Running auto-update for tour statuses...");
    const result = await autoUpdateTourStatuses();
    console.log(`Updated ${result.updated} tour statuses`);
  } catch (err) {
    console.error("Error in auto-update tour statuses:", err);
  }
});

console.log("Cron jobs initialized");
```

### Alternative: Auto-update on package fetch

**File:** `backend/controllers/packageController.js`

```javascript
const getPackage = async (req, res) => {
  try {
    // Run auto-update first
    await autoUpdateTourStatuses();

    // Then fetch packages
    const findpackage = await Packages.find()
      .populate("hotels", "name location hotel_type state_id city_id status")
      .populate({
        path: "bus_id",
        select: "bus_number bus_type total_seats capacity driver_id",
      })
      .populate("tour_guide", "name designation");

    if (!findpackage) {
      return res.status(404).json({ message: "Packages not found" });
    }

    const packagesWithAvailability = await Promise.all(
      findpackage.map((pkg) => attachAvailableSeats(pkg))
    );

    res.status(200).json(packagesWithAvailability);
  } catch (err) {
    res.status(500).json({ message: "error", error: err.message });
  }
};
```

**Install cron:** `npm install node-cron`

---

## 2️⃣ FIX: Add Payment Status to PackageBooking

### File: `backend/models/PackageBooking.js`

```javascript
const packageBookingSchema = new mongoose.Schema(
  {
    Package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    Custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    travellers: {
      type: Number,
      default: 1,
    },

    seat_numbers: {
      type: [String],
      default: [],
    },

    seat_price_details: {
      type: [
        {
          seat_number: String,
          age: Number,
          base_fare: Number,
          seat_surcharge: Number,
          final_fare: Number,
        },
      ],
      default: [],
    },

    price_per_person: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
    },
    booking_date: {
      type: Date,
      default: Date.now,
    },
    other_travelers: {
      type: [String],
    },
    booking_status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending", // ← Changed from "Active"
    },

    // ✨ NEW FIELDS:
    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    payment_id: {
      type: String, // Razorpay payment_id
    },
    payment_deadline: {
      type: Date, // Auto-cancel if not paid by this time
    },
    transaction_id: {
      type: String, // For refund tracking
    },
    refund_amount: {
      type: Number,
      default: 0,
    },

    feedback_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageBooking", packageBookingSchema);
```

---

## 3️⃣ FIX: Add Cancellation Endpoint

### File: `backend/controllers/tourbookingController.js`

Add this function:

```javascript
// ✨ NEW: Cancel package booking
const cancelPackageBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.id;

    // Get booking
    const booking = await PackageBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    if (booking.Custmer_id.toString() !== customer_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if already cancelled
    if (booking.booking_status === "Cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Check if after tour started
    const pkg = await Package.findById(booking.Package_id);
    const now = new Date();
    const startDate = new Date(pkg.start_date);

    // Calculate refund
    let refundPercent = 0;
    if (now < startDate) {
      // Before tour: 100% refund
      refundPercent = 100;
    } else {
      // After tour started: 0% refund
      refundPercent = 0;
    }

    // More complex refund logic
    const daysBefore = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    if (daysBefore >= 7) {
      refundPercent = 100;
    } else if (daysBefore >= 3) {
      refundPercent = 75;
    } else if (daysBefore >= 1) {
      refundPercent = 50;
    } else {
      refundPercent = 0;
    }

    const refundAmount = Math.round(
      (booking.total_amount * refundPercent) / 100
    );

    // Update booking
    booking.booking_status = "Cancelled";
    booking.payment_status = "Refunded";
    booking.refund_amount = refundAmount;
    await booking.save();

    // TODO: Process actual refund via Razorpay API
    // await razorpay.payments.refund(booking.payment_id, {
    //   amount: refundAmount * 100,
    // });

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
      refund: {
        amount: refundAmount,
        percentage: refundPercent,
        message: daysBefore >= 7 ? "Full refund" : `${refundPercent}% refund`,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

// Add to exports
module.exports = {
  packageBooking,
  getPackageBookedSeats,
  getAllPackageBookings,
  updatePackageBookingStatus,
  updateMyPackageBooking,
  getMyBookings,
  cancelPackageBooking, // ← NEW
};
```

### File: `backend/routes/tourbookingRoutes.js`

Add route:

```javascript
// User can cancel their booking
router.post("/cancel/:id", authMiddleware, cancelPackageBooking);
```

---

## 4️⃣ FIX: Add Seat Validation

### File: `backend/controllers/tourbookingController.js`

Update packageBooking function:

```javascript
const packageBooking = async (req, res) => {
  try {
    const { package_id, travellers, passengers, seat_numbers } = req.body;
    const customer_id = req.user.id;

    // ✅ 1. Validate passengers
    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one passenger is required" });
    }

    // ✅ 2. Validate seat_numbers
    if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one seat must be selected" });
    }

    // ✅ 3. Get package
    const pkg = await Package.findById(package_id).populate("bus_id");
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    // ✅ 4. Check if tour date is not in past
    const startDate = new Date(pkg.start_date);
    if (startDate < new Date()) {
      return res.status(400).json({ message: "Cannot book past tours" });
    }

    // ✅ 5. Get bus info
    const bus = pkg.bus_id;
    if (!bus) {
      return res.status(400).json({ message: "Package has no bus assigned" });
    }

    // ✅ 6. Get all booked seats for this package
    const bookedSeats = await getBookedSeatsForPackage(package_id);
    const availableCount = bus.total_seats - bookedSeats.length;

    // ✅ 7. Check if enough available seats
    if (travellers > availableCount) {
      return res.status(400).json({
        message: `Only ${availableCount} seats available. Requested ${travellers}`,
        available: availableCount,
        requested: travellers,
      });
    }

    // ✅ 8. Check if requested seats are actually available
    const conflictingSeats = seat_numbers.filter((seat) =>
      bookedSeats.includes(seat)
    );
    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        message: `Seats already booked: ${conflictingSeats.join(", ")}`,
        booked_seats: bookedSeats,
      });
    }

    // ✅ 9. NOW proceed with booking
    const totalamount = calculateTotalPrice(seat_numbers, pkg.price);

    const booking = new PackageBooking({
      Package_id: package_id,
      Custmer_id: customer_id,
      travellers,
      seat_numbers,
      price_per_person: pkg.price,
      total_amount: totalamount,
      booking_status: "Pending",
      payment_status: "Pending",
      payment_deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
    });

    const savedBooking = await booking.save();

    // Save passengers
    const passengerlist = passengers.map((person) => ({
      p_booking_id: savedBooking._id,
      passenger_name: person.name,
      age: person.age,
      gender: person.gender,
    }));
    await Passenger.insertMany(passengerlist);

    res.status(201).json({
      message: "Booking successful",
      booking: savedBooking,
      total_amount: totalamount,
      payment_deadline: savedBooking.payment_deadline,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

## 5️⃣ FIX: Add Cancel Button in Frontend

### File: `frontend/src/pages/MyBookings.jsx`

Add to package bookings section:

```jsx
// Inside the package booking card, add cancel button:

{
  filteredPackageBookings.map((booking) => {
    const packageInfo = booking.Package_id || {};
    const bookingDate = new Date(booking.booking_date);
    const startDate = new Date(packageInfo.start_date);
    const canCancel =
      booking.booking_status !== "Cancelled" &&
      booking.booking_status !== "Completed";

    return (
      <div key={booking._id} className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            {/* ... existing content ... */}

            <div className="d-flex gap-2">
              <button
                className="btn btn-info btn-sm"
                onClick={() => handleViewDetails(booking)}
              >
                View Details
              </button>

              {/* ✨ NEW: Cancel Button */}
              {canCancel && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to cancel this booking?"
                      )
                    ) {
                      handleCancelPackageBooking(booking._id);
                    }
                  }}
                >
                  ❌ Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });
}
```

Add this function:

```jsx
const handleCancelPackageBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `http://localhost:4000/api/tour-bookings/cancel/${bookingId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert(
      `✅ Booking cancelled.\nRefund: Rs. ${res.data.refund.amount}\n(${res.data.refund.percentage}% refund)`
    );

    // Refresh bookings
    fetchPackageBookings();
  } catch (err) {
    alert(`❌ Error: ${err.response?.data?.message || err.message}`);
  }
};
```

---

## 6️⃣ FIX: Add Auto-Cancel Unpaid Bookings

### File: `backend/index.js`

Add another cron job:

```javascript
// Auto-cancel bookings not paid within 30 minutes
cron.schedule("*/5 * * * *", async () => {
  // Every 5 minutes
  try {
    const now = new Date();
    const expiredBookings = await PackageBooking.find({
      booking_status: "Pending",
      payment_status: "Pending",
      payment_deadline: { $lt: now },
    });

    if (expiredBookings.length > 0) {
      await PackageBooking.updateMany(
        {
          booking_status: "Pending",
          payment_status: "Pending",
          payment_deadline: { $lt: now },
        },
        {
          booking_status: "Cancelled",
          payment_status: "Pending",
        }
      );

      console.log(`Auto-cancelled ${expiredBookings.length} unpaid bookings`);
    }
  } catch (err) {
    console.error("Error in auto-cancel:", err);
  }
});
```

---

## 7️⃣ BONUS: Add Invoice Download

### File: `backend/controllers/packageInvoiceController.js`

Create new file:

```javascript
const PackageBooking = require("../models/PackageBooking");
const Passenger = require("../models/Passenger");

const generatePackageInvoice = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const customer_id = req.user.id;

    // Get booking
    const booking = await PackageBooking.findById(booking_id)
      .populate("Package_id")
      .populate("Custmer_id", "first_name last_name email phone_no");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    if (booking.Custmer_id._id.toString() !== customer_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get passengers
    const passengers = await Passenger.find({ p_booking_id: booking_id });

    // Generate invoice HTML
    const invoiceNumber = `PKG-${booking._id
      .toString()
      .slice(-8)
      .toUpperCase()}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Package Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0f0f0; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tourism Package Invoice</h1>
          <p>Invoice #: ${invoiceNumber}</p>
          <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
        </div>

        <div class="section">
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${booking.Custmer_id.first_name} ${
      booking.Custmer_id.last_name
    }</p>
          <p><strong>Email:</strong> ${booking.Custmer_id.email}</p>
          <p><strong>Phone:</strong> ${booking.Custmer_id.phone_no}</p>
          <p><strong>Booking Date:</strong> ${new Date(
            booking.booking_date
          ).toLocaleDateString("en-IN")}</p>
        </div>

        <div class="section">
          <h3>Package Details</h3>
          <p><strong>Package Name:</strong> ${
            booking.Package_id.package_name
          }</p>
          <p><strong>Duration:</strong> ${booking.Package_id.duration}</p>
          <p><strong>Start Date:</strong> ${new Date(
            booking.Package_id.start_date
          ).toLocaleDateString("en-IN")}</p>
          <p><strong>End Date:</strong> ${new Date(
            booking.Package_id.end_date
          ).toLocaleDateString("en-IN")}</p>
          <p><strong>Destination:</strong> ${booking.Package_id.destination}</p>
        </div>

        <div class="section">
          <h3>Passengers</h3>
          <table>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Seat</th>
            </tr>
            ${passengers
              .map(
                (p, idx) => `
              <tr>
                <td>${p.passenger_name}</td>
                <td>${p.age}</td>
                <td>${p.gender}</td>
                <td>${booking.seat_numbers[idx] || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>

        <div class="section">
          <h3>Booking Summary</h3>
          <table>
            <tr>
              <td>Price per Person:</td>
              <td>Rs. ${booking.price_per_person}</td>
            </tr>
            <tr>
              <td>Number of Travellers:</td>
              <td>${booking.travellers}</td>
            </tr>
            <tr>
              <td>Total Amount:</td>
              <td class="total">Rs. ${booking.total_amount}</td>
            </tr>
            <tr>
              <td>Payment Status:</td>
              <td>${booking.payment_status}</td>
            </tr>
            <tr>
              <td>Booking Status:</td>
              <td>${booking.booking_status}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Cancellation Policy</h3>
          <ul>
            <li>7+ days before tour: 100% refund</li>
            <li>3-6 days before tour: 75% refund</li>
            <li>1-2 days before tour: 50% refund</li>
            <li>Less than 1 day: No refund</li>
          </ul>
        </div>

        <p style="text-align: center; margin-top: 30px; color: #666;">
          Thank you for booking with us!
        </p>
      </body>
      </html>
    `;

    res.status(200).json({
      success: true,
      invoiceNumber,
      html,
      fileName: `${invoiceNumber}.html`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error generating invoice",
      error: error.message,
    });
  }
};

module.exports = { generatePackageInvoice };
```

---

## 📋 IMPLEMENTATION ORDER

1. **Hour 1-2:** Update PackageBooking model + schema + database
2. **Hour 2-3:** Add cancellation controller + route
3. **Hour 3-4:** Add seat validation
4. **Hour 4-5:** Enable tour status auto-update (cron)
5. **Hour 5-6:** Add cancel button in frontend
6. **Hour 6-7:** Test everything

---

## ✅ TESTING CHECKLIST

After implementing fixes:

- [ ] Create package with future dates
- [ ] Book package (verify seat validation)
- [ ] Test payment workflow
- [ ] Verify booking status = "Pending"
- [ ] Check if auto-cancel works after 30 min (unpaid)
- [ ] Cancel booking (before start date)
- [ ] Verify refund calculation
- [ ] Wait for cron job to run
- [ ] Verify tour_status changed to "Running"
- [ ] Write review (should now work)
- [ ] Download invoice
