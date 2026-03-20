const express = require("express");
const router = express.Router();
const {
  getPackage,
  addPackage,
  packageById,
  updatePackage,
  deletepackage,
} = require("../controllers/packageController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const uploadPackageImages = require("../middleware/packageUploadMiddleware");

router.get("/", getPackage); //get all packages
// Protect the add route: first verify token, then check admin role
router.post(
  "/add",
  authMiddleware,
  isadmin,
  uploadPackageImages.array("images", 6),
  addPackage
); //add package post request
router.get("/:id", packageById); //get package by id
router.put(
  "/update/:id",
  authMiddleware,
  isadmin,
  uploadPackageImages.array("images", 6),
  updatePackage
); //update package by id
router.delete("/delete/:id", authMiddleware, isadmin, deletepackage); //delete package by id

module.exports = router;
