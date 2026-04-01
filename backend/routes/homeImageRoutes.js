const express = require("express");
const { getHomeImages } = require("../controllers/homeImageController");

const router = express.Router();

router.get("/", getHomeImages);

module.exports = router;
