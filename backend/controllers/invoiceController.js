const Invoice = require("../models/Invoice");
const PackageBooking = require("../models/PackageBooking");
const BusTicketBooking = require("../models/BusTicketBooking");

const createInvoice = async (req, res) => {
  try {
    const { booking_id, booking_type, transaction_id } = req.body;
    const custmer_id = req.user.id;

    const exists = await Invoice.findOne({ booking_id });
    if (exists)
      return res.status(400).json({ message: "Invoice already exists" });

    let description = "Booking";
    let amount = 100;
    let booking_date = new Date();
    let travel_date = null;
    let travellers = 1;
    let seat_numbers = [];
    let bus_details = "";
    let package_duration = "";

    if (booking_type === "Package") {
      const b = await PackageBooking.findById(booking_id).populate(
        "Package_id"
      );
      if (b) {
        description = b.Package_id?.package_name || "Tour Package";
        amount = b.total_amount || 100;
        booking_date = b.createdAt || new Date();
        travel_date = b.travel_date;
        travellers = b.number_of_traveller || 1;
        package_duration = b.Package_id?.duration || "";
      }
    } else {
      const b = await BusTicketBooking.findById(booking_id)
        .populate("route_id")
        .populate("bus_id");
      if (b) {
        description =
          (b.route_id?.boarding_from || "") +
          " to " +
          (b.route_id?.destination || "");
        amount = b.total_amount || 100;
        booking_date = b.createdAt || new Date();
        travel_date = b.travel_date;
        seat_numbers = b.seat_numbers || [];
        travellers = seat_numbers.length || 1;
        bus_details = b.bus_id
          ? `${b.bus_id.bus_type} - ${b.bus_id.bus_name} (${b.bus_id.bus_number})`
          : "";
      }
    }

    const invoice = new Invoice({
      invoice_number: "INV-" + Date.now(),
      custmer_id,
      booking_id,
      booking_type,
      description,
      booking_date,
      travel_date,
      travellers,
      seat_numbers,
      bus_details,
      package_duration,
      amount,
      payment_method: "Online (Razorpay)",
      transaction_id: transaction_id || "",
      status: "Paid",
    });
    await invoice.save();
    res.status(201).json({ message: "Invoice created", invoice });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ custmer_id: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate(
      "custmer_id",
      "first_name last_name email"
    );
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRefunded = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { booking_id: req.body.booking_id },
      { status: "Refunded" },
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInvoice,
  getMyInvoices,
  getInvoiceById,
  getAllInvoices,
  markAsRefunded,
};
