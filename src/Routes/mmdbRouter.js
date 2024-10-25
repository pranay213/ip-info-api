// routes/ipRoutes.js
const express = require("express");
const { getCountryAndLanguage } = require("../controllers/mmdbController");

const router = express.Router();

// Route to get country and language code by IP address
router.get("/", getCountryAndLanguage);

module.exports = router;
