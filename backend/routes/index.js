// const express = require('express');
// const router = express.Router();
// const Url = require('../models/Url');
// const { client } = require('../config/redis');

// // @route   GET /:code
// router.get('/:code', async (req, res) => {
//   try {
//     const url = await Url.findOne({ urlCode: req.params.code });

//     if (url) {
//       // Increment click count (Simple Analytics)
//       url.clicks++;
//       await url.save();
//       return res.redirect(url.longUrl);
//     } else {
//       return res.status(404).json('No url found');
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json('Server error');
//   }
//   try{
//     const cachedUrl = await client.get(code);
//     if (cachedUrl) {
//       logger.info(`Cache Hit for code: ${code}`);
//       return res.redirect(cachedUrl);
//     }
//   }catch (err) {
//     logger.error(`Server Error during redirect: ${err.message}`);
//     res.status(500).json('Server Error');
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const Url = require("../models/Url");
const { client } = require("../config/redis");
const logger = require("../utils/logger");

// @route    GET /:code
// @desc     Redirect to original URL
router.get("/:code", async (req, res) => {
  const { code } = req.params;

  // 1. ATTEMPT CACHE (With Graceful Fallback)
  let cachedUrl = null;
  try {
    // If Redis is down, this line might throw an error
    cachedUrl = await client.get(code);
  } catch (err) {
    // If Redis fails, we DON'T crash. we just log it and move on.
    logger.error(`Redis Error: ${err.message}. Falling back to MongoDB.`);
  }

  if (cachedUrl) {
    logger.info(`Cache Hit for: ${code}`);
    return res.redirect(cachedUrl);
  }

  // 2. FALLBACK TO DATABASE
  try {
    const url = await Url.findOne({ urlCode: code });

    if (url) {
      logger.info(`Cache Miss. Found in MongoDB for: ${code}`);

      // OPTIONAL: Re-populate cache for the next person (if Redis is back up)
      try {
        await client.set(code, url.longUrl, { EX: 86400 });
      } catch (e) {
        /* Silent fail if Redis still down */
      }

      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    logger.error(`Server Error: ${err.message}`);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
