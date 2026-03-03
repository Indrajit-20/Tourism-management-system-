const express = require("express");
const {
  getCustmer,
  deleteCustmer,
} = require("../controllers/CustmerController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const router = express.Router();

router.get("/", getCustmer);
router.delete("/delete/:id", authMiddleware, isadmin, deleteCustmer);

module.exports = router;
