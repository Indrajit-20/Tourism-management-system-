const express = require('express');
const {getCustmer, getProfile, updateProfile} = require('../controllers/CustmerController');
const {authMiddleware} = require('../middleware/authmiddleware');
const router = express.Router();


router.get("/",getCustmer);
router.get("/profile/me", authMiddleware, getProfile);
router.put("/profile/update", authMiddleware, updateProfile);


module.exports = router;