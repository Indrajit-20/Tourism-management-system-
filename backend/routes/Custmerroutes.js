const express = require("express");
const {
  getCustmer,
  getProfile,
  updateProfile,
  deleteCustmer,
} = require("../controllers/custmerController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const router = express.Router();

router.get("/", getCustmer);
router.get("/profile/me", authMiddleware, getProfile);
router.put("/profile/update", authMiddleware, updateProfile);
router.delete("/delete/:id", authMiddleware, isadmin, deleteCustmer);

module.exports = router;
