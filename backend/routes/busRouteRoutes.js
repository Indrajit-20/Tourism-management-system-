const express = require("express");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const router = express.Router();
const {
  getBusRoutes,
  addBusRoute,
  updateBusRoute,
  deleteBusRoute,
} = require("../controllers/busRouteController");

// 1. Get All Routes (Public)
router.get("/", getBusRoutes);

// 2. Add Route (Admin Only)
router.post("/add", authMiddleware, isadmin, addBusRoute);

// 3. Update Route (Admin Only)
router.put("/:id", authMiddleware, isadmin, updateBusRoute);

// 4. Delete Route (Admin Only)
router.delete("/:id", authMiddleware, isadmin, deleteBusRoute);

module.exports = router;
