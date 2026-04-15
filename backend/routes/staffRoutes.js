const express = require("express");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  getStaff,
  addStaff,
  deleteStaff,
  updateStaff, // ✅ NEW
  changePassword, // ✅ NEW
  getAvailableStaff, // ✅ NEW
} = require("../controllers/staffController");
const router = express.Router();

router.get("/", authMiddleware, isadmin, getStaff);
router.get("/available", authMiddleware, isadmin, getAvailableStaff); // ✅ NEW
router.post("/add", authMiddleware, isadmin, addStaff);
router.put("/update/:id", authMiddleware, isadmin, updateStaff); // ✅ NEW
router.put("/change-password/:id", authMiddleware, changePassword); // ✅ NEW
router.delete("/delete/:id", authMiddleware, isadmin, deleteStaff);

module.exports = router;
