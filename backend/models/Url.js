const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  urlCode: { type: String, required: true, unique: true, index: true }, // The 'abc123' part
  longUrl: { type: String, required: true }, // The original destination
  shortUrl: { type: String, required: true }, // The full new URL
  clicks: { type: Number, required: true, default: 0 }, // Analytics
  date: { type: String, default: Date.now },
});

module.exports = mongoose.model("Url", urlSchema);
