const Packages = require("../models/Package");

//show package
const getPackage = async (req, res) => {
  try {
    const findpackage = await Packages.find();
    res.status(200).json(findpackage);
  } catch (err) {
    res.status(500).json({ message: "Server Error" }, err);
  }
};

//find by id
const packageById = async (req, res) => {
  try {
    const pkg = await Packages.findById(req.params.id)
      .populate("hotel_id", "name location hotel_type")
      .populate("bus_id", "bus_number bus_type");
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.status(200).json(pkg);
  } catch (err) {
    res.status(500).json({ message: "error", error: err.message });
  }
};

//add package
const addPackage = async (req, res) => {
  try {
    //get all detail form page
    const {
      package_name,
      package_type,
      destination,
      price,
      duration,
      image_url,
      description,
      bus_id,
      hotel_id,
      start_date,
      inclusive,
      exclusive,
      status,
    } = req.body;

    //check package exists or not
    const existingPackage = await Packages.findOne({
      package_name: package_name,
    });
    if (existingPackage) {
      return res.status(400).json({ message: "Package name already exists" });
    }

    const newpackage = new Packages({
      package_name,
      package_type,
      destination,
      price,
      duration,
      image_url,
      description,
      bus_id,
      hotel_id,
      start_date,
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
    const updatepkg = await Packages.findByIdAndUpdate(id, req.body, {
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
};
