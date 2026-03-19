const BusTicketBooking = require("../models/BusTicketBooking");

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

    // HTML template for ticket
    const ticketHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .ticket-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 2px solid #2c3e50;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .ticket-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .ticket-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .ticket-header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .ticket-number {
          background: rgba(255,255,255,0.2);
          padding: 10px 20px;
          margin-top: 15px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .ticket-content {
          padding: 30px;
        }
        .section {
          margin-bottom: 25px;
          border-bottom: 1px dashed #ddd;
          padding-bottom: 15px;
        }
        .section:last-child {
          border-bottom: none;
        }
        .section-title {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          font-weight: bold;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .route-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin: 15px 0;
        }
        .location {
          flex: 1;
        }
        .location-city {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
        }
        .location-label {
          font-size: 11px;
          color: #999;
          margin-top: 3px;
        }
        .arrow {
          font-size: 24px;
          color: #667eea;
        }
        .time-info {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 10px;
          font-size: 14px;
        }
        .time-slot {
          flex: 1;
        }
        .time-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
        }
        .time-value {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin-top: 3px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .grid-2 > div {
          padding: 10px 0;
        }
        .field-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .field-value {
          font-size: 14px;
          font-weight: bold;
          color: #2c3e50;
          margin-top: 5px;
        }
        .seats-display {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .seat-badge {
          background: #667eea;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .seat-price {
          font-size: 10px;
          opacity: 0.8;
        }
        .total-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          text-align: right;
        }
        .total-label {
          font-size: 12px;
          color: #999;
        }
        .total-amount {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          margin-top: 5px;
        }
        .boarding-points {
          background: #e8f4f8;
          padding: 12px;
          border-radius: 4px;
          margin-top: 8px;
        }
        .boarding-label {
          font-size: 10px;
          color: #2c3e50;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .boarding-item {
          display: inline-block;
          background: #2c3e50;
          color: white;
          padding: 4px 8px;
          margin-right: 5px;
          margin-bottom: 5px;
          border-radius: 3px;
          font-size: 11px;
        }
        .footer {
          background: #f5f5f5;
          padding: 15px 30px;
          text-align: center;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #ddd;
        }
        .footer p {
          margin: 5px 0;
        }
        .highlight {
          background: #fffacd;
          padding: 10px;
          border-left: 4px solid #ffc107;
          margin: 15px 0;
          font-size: 12px;
        }
        @media print {
          body { background: white; }
          .ticket-container { box-shadow: none; border: none; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- Header -->
        <div class="ticket-header">
          <h1>🚌 BUS TICKET</h1>
          <p>Your Journey Awaits</p>
          <div class="ticket-number">
            TICKET #${ticketNumber}
          </div>
        </div>

        <!-- Content -->
        <div class="ticket-content">
          <!-- Route Information -->
          <div class="section">
            <div class="section-title">Journey Details</div>
            <div class="route-info">
              <div class="location">
                <div class="location-city">${
                  route?.boarding_from || "N/A"
                }</div>
                <div class="location-label">Boarding Point</div>
              </div>
              <div class="arrow">→</div>
              <div class="location">
                <div class="location-city">${route?.destination || "N/A"}</div>
                <div class="location-label">Destination</div>
              </div>
            </div>

            <div class="time-info">
              <div class="time-slot">
                <div class="time-label">📅 Date</div>
                <div class="time-value">${travelDate}</div>
              </div>
              <div class="time-slot">
                <div class="time-label">🕐 Departure</div>
                <div class="time-value">${departureTime}</div>
              </div>
              <div class="time-slot">
                <div class="time-label">🕑 Arrival</div>
                <div class="time-value">${arrivalTime}</div>
              </div>
            </div>
          </div>

          <!-- Passenger Information -->
          <div class="section">
            <div class="section-title">Passenger Information</div>
            <div class="grid-2">
              <div>
                <div class="field-label">Name</div>
                <div class="field-value">
                  ${customer?.first_name} ${customer?.last_name}
                </div>
              </div>
              <div>
                <div class="field-label">Email</div>
                <div class="field-value">${customer?.email}</div>
              </div>
              <div>
                <div class="field-label">Phone</div>
                <div class="field-value">${customer?.phone_no || "N/A"}</div>
              </div>
              <div>
                <div class="field-label">Passengers</div>
                <div class="field-value">${booking.travellers}</div>
              </div>
            </div>
          </div>

          <!-- Bus & Seat Information -->
          <div class="section">
            <div class="section-title">Bus & Seat Details</div>
            <div class="grid-2">
              <div>
                <div class="field-label">Bus Number</div>
                <div class="field-value">${bus?.bus_number || "N/A"}</div>
              </div>
              <div>
                <div class="field-label">Bus Type</div>
                <div class="field-value">${bus?.bus_type || "AC"}</div>
              </div>
            </div>
            <div style="margin-top: 15px;">
              <div class="field-label">Seats Booked</div>
              <div class="seats-display">
                ${booking.seat_numbers
                  .map(
                    (seat, index) => `
                  <div class="seat-badge">
                    ${seat}
                    ${
                      booking.seat_prices?.[index]
                        ? `<div class="seat-price">₹${booking.seat_prices[index]}</div>`
                        : ""
                    }
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>

            <!-- Boarding Points -->
            ${
              trip?.boarding_points && trip.boarding_points.length > 0
                ? `
              <div class="boarding-points">
                <div class="boarding-label">📍 Boarding Points</div>
                ${trip.boarding_points
                  .map((point) => `<div class="boarding-item">${point}</div>`)
                  .join("")}
              </div>
            `
                : ""
            }
          </div>

          <!-- Important Notice -->
          <div class="highlight">
            <strong>⚠️ Important:</strong> Please present this ticket at the boarding point 15 minutes before departure. 
            Keep this ticket safe as proof of booking.
          </div>

          <!-- Amount -->
          <div class="total-section">
            <div class="total-label">TOTAL AMOUNT PAID</div>
            <div class="total-amount">₹${booking.total_amount}</div>
          </div>

          <!-- Booking Details -->
          <div class="section" style="margin-top: 20px; border-bottom: none;">
            <div class="section-title">Booking Details</div>
            <div class="grid-2">
              <div>
                <div class="field-label">Booking ID</div>
                <div class="field-value">${booking._id}</div>
              </div>
              <div>
                <div class="field-label">Payment ID</div>
                <div class="field-value">${booking.payment_id}</div>
              </div>
              <div>
                <div class="field-label">Booking Status</div>
                <div class="field-value" style="color: #27ae60;">
                  ✅ ${booking.booking_status}
                </div>
              </div>
              <div>
                <div class="field-label">Booked On</div>
                <div class="field-value">
                  ${new Date(booking.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>
            <strong>Thank you for booking with us!</strong>
          </p>
          <p>
            For support, contact: support@busticketing.com | 1-800-BUS-HELP
          </p>
          <p>
            Downloaded on: ${new Date().toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <script>
        // Optional: Auto-print when page loads
        // window.print();
      </script>
    </body>
    </html>
    `;

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
