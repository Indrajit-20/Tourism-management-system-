// Auto-complete logic for tours/bookings based on dates
const TourSchedule = require("../models/TourSchedule");
const PackageBooking = require("../models/PackageBooking");

/**
 * Auto-mark schedules as Completed when end_date has passed
 * Run this daily at midnight or after significant date-based operations
 */
const autoCompleteTours = async () => {
  try {
    const now = new Date();

    const activeSchedules = await TourSchedule.find({
      departure_status: { $in: ["Open", "BookingFull", "Locked"] },
    });

    const toursToComplete = activeSchedules.filter((schedule) => {
      const startDate = new Date(schedule.start_date);
      return startDate < now;
    });

    if (toursToComplete.length === 0) {
      console.log("[AutoComplete] No tours to mark as completed");
      return { completed: 0 };
    }

    // Mark each tour as Completed
    for (const tour of toursToComplete) {
      tour.departure_status = "Completed";
      await tour.save();
      console.log(
        `[AutoComplete] Tour ${tour._id} marked as Completed (was ${tour.departure_status})`
      );
    }

    // Also mark confirmed bookings as completed for schedules whose start date has passed.
    const bookingUpdates = await PackageBooking.updateMany(
      {
        tour_schedule_id: { $in: toursToComplete.map((t) => t._id) },
        booking_status: "confirmed",
      },
      {
        $set: { booking_status: "completed" },
      }
    );

    console.log(
      `[AutoComplete] Updated ${bookingUpdates.modifiedCount} bookings to completed`
    );

    return { completed: toursToComplete.length, bookingsUpdated: bookingUpdates.modifiedCount };
  } catch (error) {
    console.error("[AutoComplete] Error:", error);
    throw error;
  }
};

/**
 * Auto-reject bookings that weren't approved within 48 hours
 * Release their seats back
 */
const autoRejectExpiredBookings = async () => {
  try {
    const now = new Date();

    // Find pending bookings where approval_deadline has passed
    const expiredBookings = await PackageBooking.find({
      booking_status: "pending",
      approval_deadline: { $lt: now },
    });

    if (expiredBookings.length === 0) {
      console.log("[AutoReject] No expired bookings to reject");
      return { rejected: 0 };
    }

    for (const booking of expiredBookings) {
      booking.booking_status = "rejected";
      booking.admin_note = "Auto rejected - not reviewed within 48 hours";
      booking.rejected_at = new Date();
      await booking.save();

      // Release seats back
      if (booking.tour_schedule_id) {
        const tourSchedule = await TourSchedule.findById(booking.tour_schedule_id);
        if (tourSchedule) {
          tourSchedule.seats = tourSchedule.seats.map((seat) =>
            booking.seat_numbers.includes(seat.seat_number)
              ? { ...seat.toObject(), is_booked: false, booked_by: null }
              : seat
          );
          tourSchedule.available_seats = tourSchedule.seats.filter(
            (s) => !s.is_booked
          ).length;
          if (tourSchedule.departure_status === "BookingFull") {
            tourSchedule.departure_status = "Locked";
          }
          await tourSchedule.save();
        }
      }

      console.log(`[AutoReject] Booking ${booking._id} auto-rejected`);
    }

    return { rejected: expiredBookings.length };
  } catch (error) {
    console.error("[AutoReject] Error:", error);
    throw error;
  }
};

/**
 * Auto-cancel approved bookings if payment deadline has passed
 * Release seats back
 */
const autoCancelUnpaidBookings = async () => {
  try {
    const now = new Date();

    // Find approved bookings where payment_deadline has passed
    const unpaidBookings = await PackageBooking.find({
      booking_status: "approved",
      payment_deadline: { $lt: now },
    });

    if (unpaidBookings.length === 0) {
      console.log("[AutoCancel] No unpaid bookings to cancel");
      return { cancelled: 0 };
    }

    for (const booking of unpaidBookings) {
      booking.booking_status = "cancelled";
      booking.cancellation_reason = "Payment deadline exceeded";
      // Keep schema-compatible value while still indicating auto cancellation.
      booking.cancelled_by = "admin";
      booking.cancelled_at = new Date();
      booking.admin_note = "Auto-cancelled by system due to payment deadline exceeded";
      await booking.save();

      // Release seats back
      if (booking.tour_schedule_id) {
        const tourSchedule = await TourSchedule.findById(booking.tour_schedule_id);
        if (tourSchedule) {
          tourSchedule.seats = tourSchedule.seats.map((seat) =>
            booking.seat_numbers.includes(seat.seat_number)
              ? { ...seat.toObject(), is_booked: false, booked_by: null }
              : seat
          );
          tourSchedule.available_seats = tourSchedule.seats.filter(
            (s) => !s.is_booked
          ).length;
          if (tourSchedule.departure_status === "BookingFull") {
            tourSchedule.departure_status = "Locked";
          }
          await tourSchedule.save();
        }
      }

      console.log(`[AutoCancel] Booking ${booking._id} auto-cancelled (payment deadline)`);
    }

    return { cancelled: unpaidBookings.length };
  } catch (error) {
    console.error("[AutoCancel] Error:", error);
    throw error;
  }
};

/**
 * Run all auto maintenance tasks
 */
const runAllAutoTasks = async () => {
  try {
    console.log("[AutoTasks] Starting maintenance tasks...");
    const completeTours = await autoCompleteTours();
    const rejectedBookings = await autoRejectExpiredBookings();
    const cancelledBookings = await autoCancelUnpaidBookings();
    console.log("[AutoTasks] Maintenance completed:", {
      completeTours,
      rejectedBookings,
      cancelledBookings,
    });
  } catch (error) {
    console.error("[AutoTasks] Error running maintenance:", error);
  }
};

module.exports = {
  autoCompleteTours,
  autoRejectExpiredBookings,
  autoCancelUnpaidBookings,
  runAllAutoTasks,
};
