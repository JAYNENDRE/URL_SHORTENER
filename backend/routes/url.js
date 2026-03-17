// const express = require('express');
// const router = express.Router();
// const { nanoid } = require('nanoid');
// const Url = require('../models/Url');

// // @route   POST /api/url/shorten
// router.post('/shorten', async (req, res) => {
//   const { longUrl } = req.body;
//   const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

//   try {
//     // 1. Check if the URL already exists in DB
//     let url = await Url.findOne({ longUrl });
//     if (url) {
//         return res.json(url);
//     }

//     // 2. If not, create a unique code
//     const urlCode = nanoid(7); // generates a 7-char string
//     const shortUrl = `${baseUrl}/${urlCode}`;

//     url = new Url({
//       longUrl,
//       shortUrl,
//       urlCode,
//       date: new Date()
//     });

//     await url.save();
//     res.json(url);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json('Server error');
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const { client } = require("../config/redis");
const logger = require("../utils/logger");

// helper to verify a string is a valid absolute URL
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

// @route   POST /api/url/shorten
router.post("/shorten", async (req, res) => {
  const { longUrl, customCode } = req.body;
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";

  // 1. FAIL FAST: Check if longUrl is provided
  if (!longUrl) {
    return res.status(400).json({ error: "Please provide a longUrl" });
  }

  // 2. VALIDATION: Check if it's a valid URL format
  if (!isValidUrl(longUrl)) {
    return res.status(401).json({ error: "Invalid URL format" });
  }

  try {
    let urlCode;

    // 3. CUSTOM ALIAS LOGIC & PRODUCTION HARDENING
    if (customCode) {
      // --- NEW: THE RESERVED KEYWORD SHIELD ---
      const forbiddenShortCodes = [
        "admin",
        "login",
        "api",
        "dashboard",
        "root",
        "help",
        "static",
        "config",
      ];
      if (forbiddenShortCodes.includes(customCode.toLowerCase())) {
        return res.status(400).json("This alias is reserved for system use.");
      }
      // ----------------------------------------

      // Check if this custom alias is already taken in MongoDB
      const existingCustom = await Url.findOne({ urlCode: customCode });
      if (existingCustom) {
        return res
          .status(400)
          .json("Custom alias already in use. Try another!");
      }
      urlCode = customCode;
    } else {
      // 4. DUPLICATE CHECK: Only skip if NOT using a custom code
      let existingUrl = await Url.findOne({
        longUrl,
        urlCode: { $not: /^[A-Za-z0-9_-]{7,25}$/ }, // Logical check for generated codes
      });

      if (existingUrl && !customCode) {
        return res.json(existingUrl);
      }
      urlCode = nanoid(7);
    }

    const shortUrl = `${baseUrl}/${urlCode}`;

    // 5. CREATION: Save to MongoDB
    const url = new Url({
      longUrl,
      shortUrl,
      urlCode,
      date: new Date(),
    });

    await url.save();

    // 6. CACHING: Update Redis with TTL
    try {
      await client.set(urlCode, longUrl, { EX: 86400 });
      logger.info(`New URL cached: ${urlCode}`);
    } catch (redisErr) {
      logger.error(`Redis Cache failed during creation: ${redisErr.message}`);
    }

    res.json(url);
  } catch (err) {
    logger.error("Server Error in /shorten:", err);
    res.status(500).json("Server error");
  }
});

// @route   GET /api/url/all
router.get("/all", async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 });
    res.json(urls);
  } catch (err) {
    logger.error("Fetch Error in /all:", err);
    res.status(500).json("Server error");
  }
});

module.exports = router;
