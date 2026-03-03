const express = require("express");
const {authMiddleware,isadmin} = require('../middleware/authmiddleware');
const {
  getStaff,
  addStaff,
  deleteStaff,
  
} = require("../controllers/staffController");
const router = express.Router();

router.get("/", isadmin,getStaff);
router.post("/add", authMiddleware,isadmin,addStaff);
router.delete("/delete/:id",authMiddleware,isadmin, deleteStaff);


module.exports = router;

