const Packages = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");

const attachAvailableSeats = async (packages) => {
  const packageList = Array.isArray(packages) ? packages : [packages];
  const validPackages = packageList.filter(Boolean);
  if (!validPackages.length) return Array.isArray(packages) ? [] : null;

  const packageIds = validPackages.map((pkg) => pkg._id);

  const bookingCounts = await PackageBooking.aggregate([
    {
      $match: {
        Package_id: { $in: packageIds },
        booking_status: { $nin: ["Cancelled", "Rejected"] },
      },
    },
    {
      $group: {
        _id: "$Package_id",
        booked_travellers: { $sum: { $ifNull: ["$travellers", 1] } },
      },
    },
  ]);

  const bookingMap = new Map(
    bookingCounts.map((row) => [String(row._id), row.booked_travellers || 0])
  );

  const withAvailability = validPackages.map((pkgDoc) => {
    const pkg = pkgDoc.toObject ? pkgDoc.toObject() : pkgDoc;
    const totalSeats = Number(pkg?.bus_id?.total_seats) || 0;
    const bookedTravellers = bookingMap.get(String(pkg._id)) || 0;
    const availableSeats = Math.max(totalSeats - bookedTravellers, 0);

    return {
      ...pkg,
      booked_travellers: bookedTravellers,
      available_seats: totalSeats ? availableSeats : null,
    };
  });

  return Array.isArray(packages) ? withAvailability : withAvailability[0];
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// Auto status rules:
// - end date passed -> Completed
// - start date reached -> Running
// - future start date -> Scheduled
const autoUpdateTourStatuses = async () => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const packages = await Packages.find(
    {
      $or: [
        { start_date: { $exists: true, $ne: null } },
        { end_date: { $exists: true, $ne: null } },
      ],
    },
    "start_date end_date tour_status"
  ).lean();

  const updates = [];

  for (const pkg of packages) {
    let nextStatus = pkg.tour_status || "Scheduled";

    if (pkg.end_date && new Date(pkg.end_date) < startOfToday) {
      nextStatus = "Completed";
    } else if (pkg.start_date && new Date(pkg.start_date) <= endOfToday) {
      nextStatus = "Running";
    } else if (pkg.start_date && new Date(pkg.start_date) > endOfToday) {
      nextStatus = "Scheduled";
    }

    if (nextStatus !== pkg.tour_status) {
      updates.push({
        updateOne: {
          filter: { _id: pkg._id },
          update: { $set: { tour_status: nextStatus } },
        },
      });
    }
  }

  if (updates.length) {
    await Packages.bulkWrite(updates);
  }

  return { updated: updates.length };
};

//show package
const getPackage = async (req, res) => {
  try {
    const findpackage = await Packages.find()
      .populate("hotels", "name location hotel_type state_id city_id status")
      .populate({
        path: "bus_id",
        select: "bus_number bus_name bus_type total_seats driver_id driver_ids",
        populate: [
          { path: "driver_id", select: "name designation" },
          { path: "driver_ids", select: "name designation" },
        ],
      })
      .populate("tour_guide", "name designation");

    const packageWithAvailability = await attachAvailableSeats(findpackage);
    res.status(200).json(packageWithAvailability);
  } catch (err) {
    res.status(500).json({ message: "Server Error" }, err);
  }
};

//find by id
const packageById = async (req, res) => {
  try {
    const pkg = await Packages.findById(req.params.id)
      .populate("hotels", "name location hotel_type state_id city_id status")
      .populate({
        path: "bus_id",
        select: "bus_number bus_name bus_type total_seats driver_id driver_ids",
        populate: [
          { path: "driver_id", select: "name designation" },
          { path: "driver_ids", select: "name designation" },
        ],
      })
      .populate("tour_guide", "name designation");
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    const packageWithAvailability = await attachAvailableSeats(pkg);
    res.status(200).json(packageWithAvailability);
  } catch (err) {
    res.status(500).json({ message: "error", error: err.message });
  }
};

//add package
const addPackage = async (req, res) => {
  try {
    // Read form fields from request body.
    const {
      package_name,
      package_type,
      source_city,
      destination,
      price,
      duration,
      image_urls, // New
      description,
      bus_id,
      hotels,
      tour_guide, // New
      boarding_points, // New
      pickup_points,
      sightseeing, // New
      itinerary, // New
      tour_status, // New
      start_date,
      end_date,
      inclusive,
      exclusive,
      status,
    } = req.body;

    // Keep one single pick-up list (boarding_points) for simplicity.
    const mergedBoardingPoints = toArray(boarding_points);
    if (!mergedBoardingPoints.length) {
      mergedBoardingPoints.push(...toArray(pickup_points));
    }

    //check package exists or not
    const existingPackage = await Packages.findOne({
      package_name: package_name,
    });
    if (existingPackage) {
      return res.status(400).json({ message: "Package name already exists" });
    }

    // Save uploaded image paths. Files are stored in backend/uploads/packages.
    const uploadedImages = (req.files || []).map(
      (file) => `packages/${file.filename}`
    );

    const newpackage = new Packages({
      package_name,
      package_type,
      source_city: source_city || "Ahmedabad",
      destination,
      price,
      duration,
      image_urls: uploadedImages.length ? uploadedImages : toArray(image_urls),
      description,
      bus_id,
      hotels: toArray(hotels),
      tour_guide,
      boarding_points: mergedBoardingPoints,
      pickup_points: mergedBoardingPoints,
      sightseeing: toArray(sightseeing),
      itinerary,
      tour_status,
      start_date,
      end_date,
      inclusive,
      exclusive,
      status,
    });
    const saved = await newpackage.save();
    res.status(201).json({
      message: "package added succesfully",
      package_details: saved,
    });
  } catch (err) {
    console.error("Add package error:", err);
    // Send back the actual error message to help debugging (development only)
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

//update package
const updatePackage = async (req, res) => {
  const { id } = req.params;
  try {
    // Keep one list for boarding/pick-up points during update as well.
    const mergedBoardingPoints = toArray(req.body.boarding_points);
    if (!mergedBoardingPoints.length) {
      mergedBoardingPoints.push(...toArray(req.body.pickup_points));
    }

    const payload = {
      ...req.body,
      source_city: req.body.source_city || "Ahmedabad",
      hotels: toArray(req.body.hotels),
      boarding_points: mergedBoardingPoints,
      pickup_points: mergedBoardingPoints,
      sightseeing: toArray(req.body.sightseeing),
    };

    const uploadedImages = (req.files || []).map(
      (file) => `packages/${file.filename}`
    );
    if (uploadedImages.length) {
      payload.image_urls = uploadedImages;
    }

    const updatepkg = await Packages.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!updatepkg) {
      res.status(404).json({ message: "Package not found" });
    }

    res.status(200).json(updatepkg);
  } catch (err) {
    res.status(500).json({ message: "Update Failed" }, err.message);
  }
};

//delete package

const deletepackage = async (req, res) => {
  try {
    await Packages.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" }, err);
  }
};

module.exports = {
  getPackage,
  packageById,
  addPackage,
  deletepackage,
  updatePackage,
  autoUpdateTourStatuses,
};
