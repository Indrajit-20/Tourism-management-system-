/**
 * Bus Ticket HTML Template
 * Separate the UI from the Business Logic (Refactoring)
 */
const getBusTicketTemplate = (data) => {
  const {
    ticketNumber,
    customer,
    trip,
    route,
    bus,
    booking,
    travelDate,
    departureTime,
    arrivalTime,
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bus Ticket - ${ticketNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f3f4f6; 
          color: #1f2937;
          line-height: 1.5;
          padding: 40px 20px;
        }
        .ticket-wrapper {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: relative;
        }
        
        /* Decorative Ticket Cutout */
        .ticket-wrapper::before, .ticket-wrapper::after {
          content: '';
          position: absolute;
          width: 40px;
          height: 40px;
          background-color: #f3f4f6;
          border-radius: 50%;
          top: 300px;
          z-index: 10;
        }
        .ticket-wrapper::before { left: -20px; }
        .ticket-wrapper::after { right: -20px; }

        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          padding: 40px;
          color: white;
          text-align: center;
          position: relative;
        }
        .header h1 { 
          font-size: 30px; 
          font-weight: 800; 
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .header p { font-size: 14px; opacity: 0.9; font-weight: 500; }
        .ticket-id {
          display: inline-block;
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 20px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          letter-spacing: 1px;
        }

        .main-content { padding: 40px; }
        
        .trip-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 2px dashed #e5e7eb;
        }
        .location h2 { font-size: 26px; font-weight: 800; color: #111827; margin: 0; }
        .location p { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 700; margin-top: 4px; letter-spacing: 0.5px; }
        
        .trip-icon-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px;
        }
        .bus-emoji { font-size: 24px; margin-bottom: 5px; }
        .route-line { 
          width: 100%; 
          height: 2px; 
          background: #e5e7eb; 
          position: relative;
        }
        .route-line::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          top: -3px;
          right: 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 40px;
        }
        .info-item label { 
          display: block; 
          font-size: 11px; 
          text-transform: uppercase; 
          color: #9ca3af; 
          font-weight: 700; 
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .info-item span { font-size: 16px; font-weight: 700; color: #374151; }
        
        .seats-section {
          background: #f8fafc;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 40px;
          border: 1px solid #f1f5f9;
        }
        .seats-section h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 16px; font-weight: 700; letter-spacing: 1px; }
        
        .seats-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .seat-tag {
          background: white;
          color: #1e40af;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .seat-tag small { font-size: 10px; color: #64748b; font-weight: 500; }

        .payment-summary {
          background: #111827;
          padding: 30px;
          border-radius: 20px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .payment-summary .label { font-size: 15px; font-weight: 600; opacity: 0.7; }
        .payment-summary .price { font-size: 36px; font-weight: 900; color: #60a5fa; }

        .important-notice {
          padding: 20px;
          background: #fffbeb;
          border-radius: 12px;
          border-left: 5px solid #f59e0b;
          font-size: 13px;
          color: #92400e;
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }
        .notice-icon { font-size: 20px; }

        .footer {
          padding: 40px;
          background: #f9fafb;
          border-top: 1px solid #f3f4f6;
          text-align: center;
        }
        .footer p { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
        .footer .support-line { 
          font-size: 14px; 
          color: #4b5563; 
          font-weight: 700; 
          margin-top: 15px;
          padding: 10px 20px;
          background: white;
          display: inline-block;
          border-radius: 99px;
          border: 1px solid #e5e7eb;
        }

        @media print {
          body { background: white; padding: 0; }
          .ticket-wrapper { box-shadow: none; border: 1px solid #e5e7eb; border-radius: 0; }
          .ticket-wrapper::before, .ticket-wrapper::after { display: none; }
          .header { background: #1e40af !important; -webkit-print-color-adjust: exact; }
          .payment-summary { background: #111827 !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-wrapper">
        <div class="header">
          <h1>BUS TICKET</h1>
          <p>Verified Electronic Ticket</p>
          <div class="ticket-id">TRN ID: ${ticketNumber}</div>
        </div>

        <div class="main-content">
          <div class="trip-summary">
            <div class="location">
              <h2>${route?.boarding_from || "N/A"}</h2>
              <p>Departure City</p>
            </div>
            
            <div class="trip-icon-container">
              <div class="bus-emoji">🚌</div>
              <div class="route-line"></div>
            </div>

            <div class="location" style="text-align: right;">
              <h2>${route?.destination || "N/A"}</h2>
              <p>Arrival City</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Journey Date</label>
              <span>${travelDate}</span>
            </div>
            <div class="info-item">
              <label>Bus Details</label>
              <span>${bus?.bus_number || "N/A"} (${
    bus?.bus_type || "AC"
  })</span>
            </div>
            <div class="info-item">
              <label>Lead Passenger</label>
              <span>${customer?.first_name} ${customer?.last_name}</span>
            </div>
            <div class="info-item">
              <label>Class/Type</label>
              <span>${bus?.bus_type || "Deluxe Sleeper"}</span>
            </div>
            <div class="info-item">
              <label>Departure</label>
              <span>${departureTime}</span>
            </div>
            <div class="info-item">
              <label>Arrival (Est.)</label>
              <span>${arrivalTime}</span>
            </div>
          </div>

          <div class="seats-section">
            <h3>Reserved Seats</h3>
            <div class="seats-list">
              ${booking.seat_numbers
                .map(
                  (seat, idx) => `
                <div class="seat-tag">
                  ${seat}
                  ${
                    booking.seat_prices?.[idx]
                      ? `<small>₹${booking.seat_prices[idx]}</small>`
                      : ""
                  }
                </div>`
                )
                .join("")}
            </div>
          </div>

          <div class="payment-summary">
            <div class="label">Total Fair Paid</div>
            <div class="price">₹${booking.total_amount}</div>
          </div>

          <div class="important-notice">
            <div class="notice-icon">📄</div>
            <div>
              <strong>Travel Requirements:</strong> Please report at the boarding point 15 mins before ${departureTime}. 
              Displaying this E-ticket on your smartphone is sufficient for boarding.
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Booked on ${new Date(booking.createdAt).toLocaleString(
            "en-IN"
          )}</p>
          <p>This is a computer-generated ticket and does not require a physical signature.</p>
          <div class="support-line">📞 1800-TSM-HELP | support@tsm.com</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getBusTicketTemplate,
};
