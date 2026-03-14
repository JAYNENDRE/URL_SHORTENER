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
  const { longUrl } = req.body;
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";

  // 1. FAIL FAST: Check if longUrl is provided
  if (!longUrl) {
    return res.status(400).json({ error: "Please provide a longUrl" });
  }

  // 2. VALIDATION: Check if it's a valid URL format
  // using the native URL constructor (no extra dependency)
  if (!isValidUrl(longUrl)) {
    return res.status(401).json({ error: "Invalid URL format" });
  }

  try {
    // 3. DUPLICATE CHECK: If it exists, return it instead of creating a new one
    // This saves database space and keeps your data clean
    let url = await Url.findOne({ longUrl });
    if (url) {
      return res.json(url);
    }

    // 4. CREATION: Generate unique code and save
    const urlCode = nanoid(7);
    const shortUrl = `${baseUrl}/${urlCode}`;

    url = new Url({
      longUrl,
      shortUrl,
      urlCode,
      date: new Date(),
    });

    await url.save();
    res.json(url);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json("Server error");
  }
});

// @route   GET /api/url/all
router.get("/all", async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 });
    res.json(urls);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json("Server error");
  }
});

module.exports = router;
