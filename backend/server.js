// const express = require('express');
// const connectDB = require('./config/db');
// const cors = require('cors');

// const app = express();

// // Connect to Database
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json({ extended: false }));

// // Define Routes (We will create these next)
// app.use('/', require('./routes/index'));     // For the redirect (GET /:code)
// app.use('/api/url', require('./routes/url')); // For creating links (POST /api/url/shorten)

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis"); // 1. Import the Redis connector
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

dotenv.config();

const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes",
  handler: (req, res, next, options) => {
    logger.error(`Rate limit exceeded by IP: ${req.ip}`); // Log the abuse!
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Execute the connections
connectDB(); // Connects to MongoDB
connectRedis(); // Connects to Redis (This is what's missing!)

app.use("/api/url/shorten", apiLimiter);
app.use(cors());
app.use(express.json());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);
// ... rest of your routes ...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
