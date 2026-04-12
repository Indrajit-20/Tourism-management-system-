const Invoice = require("../models/Invoice");
const PackageBooking = require("../models/PackageBooking");
const BusTicketBooking = require("../models/BusTicketBooking");

const toDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const enrichInvoiceWithBookingData = async (invoiceDoc) => {
  const invoice = invoiceDoc.toObject ? invoiceDoc.toObject() : { ...invoiceDoc };
  const isPackage = invoice.booking_type === "Package";

  if (isPackage) {
    const booking = await PackageBooking.findById(invoice.booking_id).populate(
      "tour_schedule_id",
      "start_date end_date"
    );

    if (booking) {
      if (!invoice.tour_start_date) {
        invoice.tour_start_date =
          booking.tour_schedule_id?.start_date || booking.travel_date || null;
      }

      if (!invoice.tour_end_date) {
        invoice.tour_end_date = booking.tour_schedule_id?.end_date || null;
      }

      if (!invoice.travel_date) {
        invoice.travel_date = invoice.tour_start_date || null;
      }

      if (!invoice.transaction_id) {
        invoice.transaction_id = booking.razorpay_payment_id || "";
      }
    }
  } else {
    const booking = await BusTicketBooking.findById(invoice.booking_id);

    if (booking) {
      if (!invoice.travel_date) {
        invoice.travel_date = booking.travel_date || null;
      }

      if (!invoice.transaction_id) {
        invoice.transaction_id = booking.payment_id || "";
      }
    }
  }

  return invoice;
};

const createInvoice = async (req, res) => {
  try {
    const { booking_id, booking_type, transaction_id } = req.body;
    const customer_id = req.user.id;

    const exists = await Invoice.findOne({ booking_id });
    if (exists)
      return res.status(400).json({ message: "Invoice already exists" });

    let description = "Booking";
    let amount = 100;
    let booking_date = new Date();
    let travel_date = null;
    let tour_start_date = null;
    let tour_end_date = null;
    let travellers = 1;
    let seat_numbers = [];
    let bus_details = "";
    let package_duration = "";
    let base_fare = 0;
    let child_discount = 0;
    let tax = 0;
    let gst = 0;
    let service_charges = 0;

    if (booking_type === "Package") {
      const b = await PackageBooking.findById(booking_id).populate([
        { path: "Package_id" },
        { path: "tour_schedule_id", select: "start_date end_date" },
      ]);
      if (b) {
        description = b.Package_id?.package_name || "Tour Package";
        amount = b.total_amount || 100;
        booking_date = b.createdAt || new Date();
        tour_start_date = b.tour_schedule_id?.start_date || b.travel_date || null;
        tour_end_date = b.tour_schedule_id?.end_date || null;
        travel_date = tour_start_date;
        travellers = b.travellers || b.number_of_traveller || 1;
        package_duration = b.Package_id?.duration || "";

        // Calculate Package child discount based on final paid amount.
        if (b.seat_price_details && Array.isArray(b.seat_price_details)) {
          base_fare = b.seat_price_details.reduce((sum, seat) => sum + (seat.base_fare || 0), 0);
          child_discount = Math.max(0, base_fare - Number(amount || 0));
        } else {
          const perPerson = Number(b.price_per_person || 0);
          const travellerCount = Number(travellers || 0);
          base_fare = perPerson > 0 && travellerCount > 0 ? perPerson * travellerCount : amount;
          child_discount = Math.max(0, Number(base_fare || 0) - Number(amount || 0));
        }
      }
    } else {
      const b = await BusTicketBooking.findById(booking_id).populate({
        path: "trip_id",
        populate: [
          { path: "bus_id", select: "bus_type bus_name bus_number" },
          {
            path: "schedule_id",
            populate: { path: "route_id", select: "boarding_from destination" },
          },
        ],
      });
      if (b) {
        const route = b.trip_id?.schedule_id?.route_id;
        const bus = b.trip_id?.bus_id;
        description =
          (route?.boarding_from || "") +
          " to " +
          (route?.destination || "");
        amount = b.total_amount || 100;
        booking_date = b.createdAt || new Date();
        travel_date = b.travel_date;
        seat_numbers = b.seat_numbers || [];
        travellers = b.travellers || seat_numbers.length || 1;
        bus_details = bus
          ? `${bus.bus_type} - ${bus.bus_name} (${bus.bus_number})`
          : "";

        // Keep bus fare breakdown easy to understand.
        base_fare = (b.price_per_seat || 0) * (seat_numbers.length || 1);
        service_charges = 0; // Can be calculated if needed
      }
    }

    // Keep bus invoices tax-free to match payment flow amounts.
    if (booking_type === "Package") {
      tax = Math.round(((Number(amount || 0) * 5) / 105) * 100) / 100;
      gst = tax;
    } else {
      tax = 0;
      gst = 0;
    }

    const invoice = new Invoice({
      invoice_number: "INV-" + Date.now(),
      customer_id,
      booking_id,
      booking_type,
      description,
      booking_date,
      travel_date,
      tour_start_date,
      tour_end_date,
      travellers,
      seat_numbers,
      bus_details,
      package_duration,
      amount,
      base_fare,
      child_discount,
      tax,
      gst,
      service_charges,
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
    const invoices = await Invoice.find({ customer_id: req.user.id }).sort({
      createdAt: -1,
    });

    const enrichedInvoices = await Promise.all(
      invoices.map((invoice) => enrichInvoiceWithBookingData(invoice))
    );

    res.json(enrichedInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const enrichedInvoice = await enrichInvoiceWithBookingData(invoice);
    res.json(enrichedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate(
      "customer_id",
      "first_name last_name email"
    );
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      customer_id: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const enrichedInvoice = await enrichInvoiceWithBookingData(invoice);

    const isPkg = enrichedInvoice.booking_type === "Package";
    const invoiceDate = toDateLabel(enrichedInvoice.createdAt);
    const travelDate = toDateLabel(enrichedInvoice.travel_date);
    const tourStartDate = toDateLabel(
      enrichedInvoice.tour_start_date || enrichedInvoice.travel_date
    );
    const tourEndDate = toDateLabel(enrichedInvoice.tour_end_date);

    // Fallback math so older invoices still display clean values.
    const amountValue = Number(enrichedInvoice.amount || 0);
    const storedBaseFare = Number(enrichedInvoice.base_fare || 0);
    const storedChildDiscount = Number(enrichedInvoice.child_discount || 0);
    const baseFareValue = isPkg
      ? (storedBaseFare > 0 ? storedBaseFare : amountValue + storedChildDiscount)
      : (storedBaseFare > 0 ? storedBaseFare : amountValue);
    const childDiscountValue = isPkg
      ? Math.max(0, storedChildDiscount || (baseFareValue - amountValue))
      : 0;
    const netFareValue = Math.max(0, baseFareValue - childDiscountValue);
    const taxValue = isPkg ? Number(enrichedInvoice.gst || 0) : 0;
    const perTravellerValue = Number(enrichedInvoice.travellers || 1) > 0
      ? netFareValue / Number(enrichedInvoice.travellers || 1)
      : netFareValue;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${enrichedInvoice.invoice_number}</title>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TRAVEL INVOICE</h1>
            <p>${enrichedInvoice.invoice_number}</p>
            <div class="invoice-type ${isPkg ? 'tour-badge' : 'bus-badge'}">
              ${isPkg ? 'TOUR PACKAGE' : 'BUS TICKET'}
            </div>
          </div>

          <div class="body">
            <div class="row">
              <div class="col">
                <div class="col-label">Invoice Date</div>
                <div class="col-value">${invoiceDate}</div>
              </div>
              <div class="col">
                <div class="col-label">${isPkg ? 'Start Date' : 'Travel Date'}</div>
                <div class="col-value">${isPkg ? tourStartDate : travelDate}</div>
              </div>
              <div class="col">
                <div class="col-label">Travellers</div>
                <div class="col-value">${enrichedInvoice.travellers || 1}</div>
              </div>
            </div>

            ${
              isPkg
                ? `
                  <div class="row">
                    <div class="col">
                      <div class="col-label">End Date</div>
                      <div class="col-value">${tourEndDate}</div>
                    </div>
                    <div class="col">
                      <div class="col-label">Per Traveller</div>
                      <div class="col-value">${toMoney(perTravellerValue)}</div>
                    </div>
                  </div>
                `
                : ''
            }

            <div class="divider"></div>

            <div class="section-title">Journey Details</div>
            <div class="row">
              <div class="col">
                <div class="col-label">${isPkg ? 'Tour Package' : 'Route'}</div>
                <div class="col-value">${enrichedInvoice.description || '-'}</div>
              </div>
            </div>

            ${
              !isPkg && enrichedInvoice.seat_numbers?.length > 0
                ? `
                  <div class="row">
                    <div class="col">
                      <div class="col-label">Seats</div>
                      <div class="col-value">${enrichedInvoice.seat_numbers.join(', ')}</div>
                    </div>
                  </div>
                `
                : ''
            }

            ${
              !isPkg && enrichedInvoice.bus_details
                ? `
                  <div class="row">
                    <div class="col">
                      <div class="col-label">Bus Details</div>
                      <div class="col-value">${enrichedInvoice.bus_details}</div>
                    </div>
                  </div>
                `
                : ''
            }

            ${
              isPkg && enrichedInvoice.package_duration
                ? `
                  <div class="row">
                    <div class="col">
                      <div class="col-label">Package Duration</div>
                      <div class="col-value">${enrichedInvoice.package_duration}</div>
                    </div>
                  </div>
                `
                : ''
            }

            <div class="divider"></div>

            <div class="section-title">Price Breakdown</div>
            ${
              baseFareValue > 0
                ? `<div class="details-row">
                     <span class="details-label">Base Fare</span>
                     <span class="details-value">${toMoney(baseFareValue)}</span>
                   </div>`
                : ''
            }

            ${
              isPkg && childDiscountValue > 0
                ? `<div class="details-row">
                     <span class="details-label">Child Discount</span>
                     <span class="details-value discount">-${toMoney(childDiscountValue)}</span>
                   </div>`
                : ''
            }

            ${
              !isPkg && enrichedInvoice.service_charges > 0
                ? `<div class="details-row">
                     <span class="details-label">Service Charges</span>
                     <span class="details-value">${toMoney(enrichedInvoice.service_charges)}</span>
                   </div>`
                : ''
            }

            ${
              taxValue > 0
                ? `<div class="details-row">
                     <span class="details-label">Tax (5% Included)</span>
                     <span class="details-value tax">${toMoney(taxValue)}</span>
                   </div>`
                : ''
            }

            <div class="details-row total">
              <span>Total Amount Paid</span>
              <span class="details-value">${toMoney(enrichedInvoice.amount)}</span>
            </div>

            <div class="divider"></div>

            <div class="section-title">Payment Details</div>
            <div class="row">
              <div class="col">
                <div class="col-label">Payment Method</div>
                <div class="col-value">${enrichedInvoice.payment_method || 'Online'}</div>
              </div>
              <div class="col">
                <div class="col-label">Transaction ID</div>
                <div class="col-value">${enrichedInvoice.transaction_id || '-'}</div>
              </div>
            </div>

            <div class="row">
              <div class="col">
                <div class="col-label">Status</div>
                <div class="col-value" style="color: #15803d; font-weight: 700;">
                  ✓ ${enrichedInvoice.status}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>Thank you for your booking.</div>
            <span class="footer-badge ${isPkg ? 'tour-badge' : 'bus-badge'}">
              ${enrichedInvoice.status}
            </span>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${enrichedInvoice.invoice_number}.html"`
    );
    return res.send(html);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
  downloadInvoice,
  markAsRefunded,
};
