const mongoose = require("mongoose");

const BusTripSchema = new mongoose.Schema(
	{
		// Link to the schedule template (master plan)
		// This connects the trip to a recurring plan (e.g., "Daily 8:00 AM Ahmedabad → Rajkot").
		schedule_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "BusSchedule",
			required: true,
		},

		// Assigned bus for this trip
		bus_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Bus",
		},

		// Assigned driver (staff)
		driver_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Staff",
		},

		// Actual date of the trip (the concrete day this instance runs)
		trip_date: {
			type: Date,
			required: true,
		},

		// Lifecycle status for this trip
		status: {
			type: String,
			enum: ["Scheduled", "Running", "Completed", "Cancelled"],
			default: "Scheduled",
		},

		// Optional boarding points for this trip (can override template)
		boarding_points: [String],

		// Optional seat layout/pricing for this trip
		seats: [
			{
				seat_number: { type: String, required: true },
				row: { type: Number, required: true },
				column: { type: Number, required: true },
				type: { type: String, enum: ["window", "aisle", "middle", "sleeper"], default: "aisle" },
				price: { type: Number, default: 0 }, // ✅ Dynamic pricing per seat
				is_available: { type: Boolean, default: true },
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("BusTrip", BusTripSchema);