const BusTicketBooking = require("../models/BusTicketBooking");
const { getBusTicketTemplate } = require("../utils/ticketTemplate");

// ✅ Generate Ticket HTML/PDF for Download
const generateTicketPDF = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const customer_id = req.user.id;

    // Fetch booking with all details
    const booking = await BusTicketBooking.findById(booking_id)
      .populate("customer_id", "first_name last_name email phone_no")
      .populate({
        path: "trip_id",
        populate: [
          { path: "bus_id", select: "bus_number bus_type capacity" },
          {
            path: "schedule_id",
            populate: {
              path: "route_id",
              select: "boarding_from destination price_per_seat",
            },
          },
        ],
      });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security check — user can only download their own ticket
    if (booking.customer_id._id.toString() !== customer_id) {
      return res.status(403).json({ message: "Unauthorized: Not your ticket" });
    }

    // Only confirmed bookings have tickets
    if (booking.booking_status !== "Confirmed") {
      return res.status(400).json({
        message:
          "Ticket not available. Booking must be Confirmed with payment completed.",
      });
    }

    // Build ticket details
    const customer = booking.customer_id;
    const trip = booking.trip_id;
    const route = trip?.schedule_id?.route_id;
    const bus = trip?.bus_id;

    const travelDate = new Date(booking.travel_date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

    const departureTime = trip?.schedule_id?.departure_time || "N/A";
    const arrivalTime = trip?.schedule_id?.arrival_time || "N/A";

    // Generate ticket number if not already generated
    let ticketNumber = booking.ticket_number;
    if (!ticketNumber) {
      ticketNumber = `BUS-${booking._id}-${Date.now()}`;
    }

    // Call the External Template (Refactored)
    const ticketHTML = getBusTicketTemplate({
      ticketNumber,
      customer,
      trip,
      route,
      bus,
      booking,
      travelDate,
      departureTime,
      arrivalTime,
    });

    // Send HTML as response with PDF headers
    res.status(200).json({
      success: true,
      html: ticketHTML,
      ticketNumber: ticketNumber,
      fileName: `Bus-Ticket-${ticketNumber}.html`,
    });
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).json({
      message: "Error generating ticket",
      error: error.message,
    });
  }
};

module.exports = {
  generateTicketPDF,
};
