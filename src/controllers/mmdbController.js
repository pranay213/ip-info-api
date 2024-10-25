const maxmind = require("maxmind");
const path = require("path");
const requestIp = require("request-ip");
const { getLanguageCode } = require("../utils/countryLanguageMap");

// Path to your MMDB file
// const mmdbFilePath = path.join(__dirname, "../mmdb/GeoLite2-City.mmdb"); // Use GeoLite2-City.mmdb here
const mmdbFilePath = path.join(__dirname, "../mmdb/IP2LOCATION-LITE-DB1.MMDB"); // Use GeoLite2-City.mmdb here

// Function to get country and language code from IP
async function getCountryAndLanguage(req, res) {
  const ip = req.query.ip || req.clientIp;

  try {
    const reader = await maxmind.open(mmdbFilePath);
    const result = reader.get(ip);

    if (result) {
      const countryCode = result.country ? result.country.iso_code : "Unknown";
      const languageCode = getLanguageCode(countryCode);

      return res.json({
        success: true,
        data: { lang: languageCode, country: countryCode },
        message: "Request sent successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        data: { lang: "Unknown", country: "Unknown" },
        message: "IP address not found",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      data: { lang: "Unknown", country: "Unknown" },
      message: "Internal server error",
    });
  }
}

module.exports = { getCountryAndLanguage };
