// filepath: backend/controllers/cancellationController.js
const Cancellation = require("../models/Cancellation");
const BusTicketBooking = require("../models/BusTicketBooking");
const PackageBooking = require("../models/PackageBooking");

// User cancels a booking
const cancelBooking = async (req, res) => {
  try {
    const { booking_id, booking_type, refund_amount, reason } = req.body;
    const custmer_id = req.user.id;

    // 1. Update the original booking status
    if (booking_type === "Bus") {
      await BusTicketBooking.findByIdAndUpdate(booking_id, {
        booking_status: "Cancelled",
      });
    } else if (booking_type === "Package") {
      await PackageBooking.findByIdAndUpdate(booking_id, {
        booking_status: "Cancelled",
      });
    }

    // 2. Create cancellation record
    const cancellation = new Cancellation({
      custmer_id,
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
      .populate("custmer_id", "first_name last_name email")
      .sort({ cancelled_at: -1 });

    res.status(200).json(cancellations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cancellations", error: error.message });
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
    const custmer_id = req.user.id;

    const cancellations = await Cancellation.find({ custmer_id }).sort({
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
  cancelBooking,
  getAllCancellations,
  markRefundDone,
  getMyCancellations,
};
