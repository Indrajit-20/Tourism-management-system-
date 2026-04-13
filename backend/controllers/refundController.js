const Refund = require("../models/Refund");
const Cancellation = require("../models/Cancellation");

// Get All Refunds (Admin)
const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate("customer_id", "first_name last_name email")
      .sort({ refund_date: -1 });

    res.status(200).json(refunds);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching refunds", error: error.message });
  }
};

// Get My Refunds (Customer)
const getMyRefunds = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const refunds = await Refund.find({ customer_id }).sort({
      refund_date: -1,
    });
    res.status(200).json(refunds);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching refunds", error: error.message });
  }
};

// Create Refund Record (Admin marks refund done)
const createRefund = async (req, res) => {
  try {
    const { cancellation_id, refund_mode, transaction_id, notes } = req.body;

    const cancellation = await Cancellation.findById(cancellation_id);
    if (!cancellation) {
      return res.status(404).json({ message: "Cancellation not found" });
    }

    const refund = new Refund({
      refund_id: "REF-" + Date.now(),
      cancellation_id,
      customer_id: cancellation.customer_id,
      booking_id: cancellation.booking_id,
      booking_type: cancellation.booking_type,
      refund_amount: cancellation.refund_amount,
      refund_mode: refund_mode || "Online",
      refund_date: new Date(),
      refund_status: "Completed",
      transaction_id: transaction_id || "",
      notes: notes || "",
    });

    await refund.save();

    // Update cancellation status
    await Cancellation.findByIdAndUpdate(cancellation_id, {
      status: "Refund Done",
    });

    res.status(201).json({
      message: "Refund created successfully",
      refund,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating refund", error: error.message });
  }
};

module.exports = {
  getAllRefunds,
  getMyRefunds,
  createRefund,
};
