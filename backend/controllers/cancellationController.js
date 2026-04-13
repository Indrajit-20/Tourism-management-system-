// filepath: backend/controllers/cancellationController.js
const Cancellation = require("../models/Cancellation");
const BusTicketBooking = require("../models/BusTicketBooking");
const PackageBooking = require("../models/PackageBooking");
const TourSchedule = require("../models/TourSchedule");

const PACKAGE_CANCEL_ALLOWED_STATUSES = new Set([
  "pending",
  "approved",
  "confirmed",
]);

const toDayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayDifference = (fromDate, toDate) => {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.round((toDayStart(toDate) - toDayStart(fromDate)) / msInDay);
};

const calculatePackageRefund = ({ booking, schedule }) => {
  const bookingStatus = String(booking.booking_status || "").toLowerCase();
  const totalPaid = Number(booking.total_amount || 0);

  if (!PACKAGE_CANCEL_ALLOWED_STATUSES.has(bookingStatus)) {
    return {
      allowed: false,
      message: "This booking cannot be cancelled",
    };
  }

  if (bookingStatus === "pending" || bookingStatus === "approved") {
    return {
      allowed: true,
      refundAmount: 0,
      refundPercent: 0,
      nonRefundableAmount: totalPaid,
      reason: "Not paid yet",
    };
  }

  if (!schedule?.start_date) {
    return {
      allowed: false,
      message: "Unable to calculate refund without schedule start date",
    };
  }

  const today = new Date();
  const startDate = new Date(schedule.start_date);
  const daysDiff = getDayDifference(today, startDate);

  if (daysDiff < 0) {
    return {
      allowed: false,
      message: "Cannot cancel after travel date",
    };
  }

  let refundPercent = 0;
  if (daysDiff >= 15) refundPercent = 100;
  else if (daysDiff >= 7) refundPercent = 80;
  else if (daysDiff >= 3) refundPercent = 60;
  else refundPercent = 40;

  const refundAmount = Math.round((totalPaid * refundPercent) / 100);
  return {
    allowed: true,
    refundAmount,
    refundPercent,
    nonRefundableAmount: Math.max(totalPaid - refundAmount, 0),
    reason: `Refund ${refundPercent}% as per cancellation policy`,
  };
};

const releasePackageSeats = async (booking) => {
  if (!booking?.tour_schedule_id) return;

  const schedule = await TourSchedule.findById(booking.tour_schedule_id);
  if (!schedule) return;

  const bookedSet = new Set(
    (booking.seat_numbers || []).map((seat) => String(seat).toUpperCase())
  );

  schedule.seats = (schedule.seats || []).map((seat) => {
    const seatNo = String(seat.seat_number || "").toUpperCase();
    if (!bookedSet.has(seatNo)) return seat;

    return {
      ...seat.toObject(),
      is_booked: false,
      booked_by: null,
    };
  });

  schedule.available_seats = (schedule.seats || []).filter(
    (seat) => !seat.is_booked
  ).length;
  if (
    schedule.available_seats > 0 &&
    schedule.departure_status === "BookingFull"
  ) {
    schedule.departure_status = "Open";
  }

  await schedule.save();
};

const getPackageCancellationPreview = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const customer_id = req.user.id;

    if (!booking_id) {
      return res.status(400).json({ message: "booking_id is required" });
    }

    const booking = await PackageBooking.findOne({
      _id: booking_id,
      customer_id: customer_id,
    });
    if (!booking) {
      return res.status(404).json({ message: "Package booking not found" });
    }

    const status = String(booking.booking_status || "").toLowerCase();
    if (status === "completed") {
      return res
        .status(400)
        .json({ message: "Completed booking cannot be cancelled" });
    }
    if (status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const schedule = booking.tour_schedule_id
      ? await TourSchedule.findById(booking.tour_schedule_id, "start_date")
      : null;

    const refundInfo = calculatePackageRefund({ booking, schedule });
    if (!refundInfo.allowed) {
      return res.status(400).json({ message: refundInfo.message });
    }

    return res.status(200).json({
      booking_id,
      amount_paid: Number(booking.total_amount || 0),
      refund_amount: refundInfo.refundAmount,
      non_refundable_amount: refundInfo.nonRefundableAmount,
      refund_percent: refundInfo.refundPercent,
      reason: refundInfo.reason,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error preparing cancellation preview",
      error: error.message,
    });
  }
};

// User cancels a booking
const cancelBooking = async (req, res) => {
  try {
    const { booking_id, booking_type, reason } = req.body;
    const customer_id = req.user.id;
    let refund_amount = 0;

    // 1. Update the original booking status
    if (booking_type === "Bus") {
      await BusTicketBooking.findByIdAndUpdate(booking_id, {
        booking_status: "Cancelled",
      });
    } else if (booking_type === "Package") {
      const pkgBooking = await PackageBooking.findOne({
        _id: booking_id,
        customer_id: customer_id,
      });
      if (!pkgBooking) {
        return res.status(404).json({ message: "Package booking not found" });
      }

      const normalizedStatus = String(
        pkgBooking.booking_status || ""
      ).toLowerCase();
      if (normalizedStatus === "completed") {
        return res
          .status(400)
          .json({ message: "Completed booking cannot be cancelled" });
      }
      if (normalizedStatus === "cancelled") {
        return res
          .status(400)
          .json({ message: "Booking is already cancelled" });
      }

      const schedule = pkgBooking.tour_schedule_id
        ? await TourSchedule.findById(pkgBooking.tour_schedule_id, "start_date")
        : null;
      const refundInfo = calculatePackageRefund({
        booking: pkgBooking,
        schedule,
      });
      if (!refundInfo.allowed) {
        return res.status(400).json({ message: refundInfo.message });
      }

      refund_amount = refundInfo.refundAmount;

      pkgBooking.booking_status = "cancelled";
      pkgBooking.cancelled_by = "customer";
      pkgBooking.cancellation_reason = reason || "Cancelled by user";
      pkgBooking.cancelled_at = new Date();
      pkgBooking.refund_amount = refund_amount;
      pkgBooking.refund_status = refund_amount > 0 ? "pending" : "none";
      if (refund_amount > 0 && pkgBooking.payment_status === "paid") {
        pkgBooking.payment_status = "refunded";
      }
      await pkgBooking.save();

      await releasePackageSeats(pkgBooking);
    } else {
      return res.status(400).json({ message: "Invalid booking_type" });
    }

    // 2. Create cancellation record
    const cancellation = new Cancellation({
      customer_id,
      booking_id,
      booking_type,
      refund_amount,
      cancellation_reason: reason,
      status: "Cancelled",
    });

    await cancellation.save();

    res.status(201).json({
      message: "Booking cancelled! You'll get ₹" + refund_amount + " refund",
      cancellation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling booking", error: error.message });
  }
};

// Admin: See all cancellations
const getAllCancellations = async (req, res) => {
  try {
    const cancellations = await Cancellation.find()
      .populate("customer_id", "first_name last_name email")
      .sort({ cancelled_at: -1 });

    res.status(200).json(cancellations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cancellations", error: error.message });
  }
};
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, admin_notes } = req.body;

    if (refund_amount === undefined || refund_amount === null) {
      return res.status(400).json({ message: "refund_amount is required" });
    }

    if (Number(refund_amount) < 0) {
      return res
        .status(400)
        .json({ message: "refund_amount cannot be negative" });
    }

    const cancellation = await Cancellation.findByIdAndUpdate(
      id,
      {
        refund_amount: Number(refund_amount),
        status: "Refund Done",
        admin_notes: admin_notes || "",
      },
      { new: true }
    );

    if (!cancellation) {
      return res.status(404).json({ message: "Cancellation not found" });
    }

    res.status(200).json({
      message: `Refund of ₹${refund_amount} processed successfully`,
      cancellation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing refund", error: error.message });
  }
};

// Admin: Mark refund as done
const markRefundDone = async (req, res) => {
  try {
    const { id } = req.params;

    const cancellation = await Cancellation.findByIdAndUpdate(
      id,
      { status: "Refund Done" },
      { new: true }
    );

    if (!cancellation) {
      return res.status(404).json({ message: "Cancellation not found" });
    }

    res.status(200).json({
      message: "Refund marked as done",
      cancellation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating refund", error: error.message });
  }
};

// User: Get their own cancellations
const getMyCancellations = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const cancellations = await Cancellation.find({ customer_id }).sort({
      createdAt: -1,
    });

    res.status(200).json(cancellations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cancellations", error: error.message });
  }
};

module.exports = {
  getPackageCancellationPreview,
  cancelBooking,
  getAllCancellations,
  processRefund,
  markRefundDone,
  getMyCancellations,
};
