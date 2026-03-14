const express = require('express');
const router = express.Router();
const Url = require('../models/Url');
const { client } = require('../config/redis');

// @route   GET /:code
router.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      // Increment click count (Simple Analytics)
      url.clicks++;
      await url.save();
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json('No url found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
  try{
    const cachedUrl = await client.get(code);
    if (cachedUrl) {
      logger.info(`Cache Hit for code: ${code}`);
      return res.redirect(cachedUrl);
    }
  }catch (err) {
    logger.error(`Server Error during redirect: ${err.message}`);
    res.status(500).json('Server Error');
  }
});

module.exports = router;