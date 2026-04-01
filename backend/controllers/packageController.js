const Packages = require("../models/Package");
const TourSchedule = require("../models/TourSchedule");
const fs = require("fs/promises");
const path = require("path");

const packageUploadsDir = path.join(__dirname, "..", "uploads", "packages");
const MAX_HOTELS_PER_PACKAGE = 6;

const toPackageImagePath = (imageRef) => {
  if (!imageRef || typeof imageRef !== "string") return null;
  const normalized = imageRef.replace(/\\/g, "/").trim();
  if (!normalized.startsWith("packages/")) return null;

  const fileName = path.basename(normalized);
  if (!fileName) return null;

  return path.join(packageUploadsDir, fileName);
};

const deletePackageImages = async (imageRefs = []) => {
  const deleteTasks = imageRefs
    .map(toPackageImagePath)
    .filter(Boolean)
    .map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.warn("Failed to delete package image:", filePath, error.message);
        }
      }
    });

  await Promise.all(deleteTasks);
};

const attachAvailableSeats = async (packages) => {
  const packageList = Array.isArray(packages) ? packages : [packages];
  const validPackages = packageList.filter(Boolean);
  if (!validPackages.length) return Array.isArray(packages) ? [] : null;

  const packageIds = validPackages.map((pkg) => pkg._id);

  const scheduleAvailability = await TourSchedule.aggregate([
    {
      $match: {
        package_id: { $in: packageIds },
        departure_status: { $in: ["Open", "BookingFull"] },
      },
    },
    {
      $group: {
        _id: "$package_id",
        total_available_seats: { $sum: { $ifNull: ["$available_seats", 0] } },
        total_seats: { $sum: { $ifNull: ["$total_seats", 0] } },
      },
    },
  ]);

  const availabilityMap = new Map(
    scheduleAvailability.map((row) => [
      String(row._id),
      {
        available: row.total_available_seats || 0,
        total: row.total_seats || 0,
      },
    ])
  );

  const withAvailability = validPackages.map((pkgDoc) => {
    const pkg = pkgDoc.toObject ? pkgDoc.toObject() : pkgDoc;
    const availability = availabilityMap.get(String(pkg._id)) || {
      available: 0,
      total: 0,
    };

    return {
      ...pkg,
      available_seats: availability.available,
      total_seats: availability.total,
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

const getPackage = async (req, res) => {
  try {
    const packageList = await Packages.find()
      .populate("hotels", "name location hotel_type state_id city_id status")
      .populate("tour_guide", "name designation");

    const packageWithAvailability = await attachAvailableSeats(packageList);
    res.status(200).json(packageWithAvailability);
  } catch (err) {
    res.status(500).json({ message: "Server Error" }, err);
  }
};

const packageById = async (req, res) => {
  try {
    const pkg = await Packages.findById(req.params.id)
      .populate("hotels", "name location hotel_type state_id city_id status")
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

const addPackage = async (req, res) => {
  try {
    const {
      package_name,
      package_type,
      source_city,
      destination,
      duration,
      image_urls,
      description,
      hotels,
      tour_guide,
      boarding_points,
      pickup_points,
      sightseeing,
      itinerary,
      inclusive,
      exclusive,
      status,
    } = req.body;

    const mergedBoardingPoints = toArray(boarding_points);
    if (!mergedBoardingPoints.length) {
      mergedBoardingPoints.push(...toArray(pickup_points));
    }

    const existingPackage = await Packages.findOne({
      package_name: package_name,
    });
    if (existingPackage) {
      return res.status(400).json({ message: "Package name already exists" });
    }

    const uploadedImages = (req.files || []).map(
      (file) => `packages/${file.filename}`
    );

    const normalizedHotels = toArray(hotels);
    if (normalizedHotels.length > MAX_HOTELS_PER_PACKAGE) {
      return res.status(400).json({
        message: `Maximum ${MAX_HOTELS_PER_PACKAGE} hotels allowed per package`,
      });
    }

    const newPackage = new Packages({
      package_name,
      package_type,
      source_city: source_city || "Ahmedabad",
      destination,
      duration,
      image_urls: uploadedImages.length ? uploadedImages : toArray(image_urls),
      description,
      hotels: normalizedHotels,
      tour_guide,
      boarding_points: mergedBoardingPoints,
      pickup_points: mergedBoardingPoints,
      sightseeing: toArray(sightseeing),
      itinerary,
      inclusive,
      exclusive,
      status,
    });
    const saved = await newPackage.save();
    res.status(201).json({
      message: "package added succesfully",
      package_details: saved,
    });
  } catch (err) {
    console.error("Add package error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const updatePackage = async (req, res) => {
  const { id } = req.params;
  const uploadedImages = (req.files || []).map(
    (file) => `packages/${file.filename}`
  );

  try {
    const existingPackage = await Packages.findById(id);
    if (!existingPackage) {
      if (uploadedImages.length) {
        await deletePackageImages(uploadedImages);
      }
      return res.status(404).json({ message: "Package not found" });
    }

    const mergedBoardingPoints = toArray(req.body.boarding_points);
    if (!mergedBoardingPoints.length) {
      mergedBoardingPoints.push(...toArray(req.body.pickup_points));
    }

    const normalizedHotels = toArray(req.body.hotels);
    if (normalizedHotels.length > MAX_HOTELS_PER_PACKAGE) {
      if (uploadedImages.length) {
        await deletePackageImages(uploadedImages);
      }
      return res.status(400).json({
        message: `Maximum ${MAX_HOTELS_PER_PACKAGE} hotels allowed per package`,
      });
    }

    const payload = {
      ...req.body,
      source_city: req.body.source_city || "Ahmedabad",
      hotels: normalizedHotels,
      boarding_points: mergedBoardingPoints,
      pickup_points: mergedBoardingPoints,
      sightseeing: toArray(req.body.sightseeing),
    };

    delete payload.tour_status;
    delete payload.start_date;
    delete payload.end_date;
    delete payload.price;

    if (uploadedImages.length) {
      payload.image_urls = uploadedImages;
    }

    const updatepkg = await Packages.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (payload.image_urls) {
      const nextImages = new Set((payload.image_urls || []).map(String));
      const previousImages = (existingPackage.image_urls || []).map(String);
      const removedImages = previousImages.filter((imageRef) => !nextImages.has(imageRef));
      await deletePackageImages(removedImages);
    }

    res.status(200).json(updatepkg);
  } catch (err) {
    if (uploadedImages.length) {
      await deletePackageImages(uploadedImages);
    }
    res.status(500).json({ message: "Update Failed" }, err.message);
  }
};

//delete package

const deletepackage = async (req, res) => {
  try {
    const pkg = await Packages.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    await deletePackageImages(pkg.image_urls || []);
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
};
