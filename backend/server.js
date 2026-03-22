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
// const express = require("express");
// const connectDB = require("./config/db");
// const { connectRedis } = require("./config/redis"); // 1. Import the Redis connector
// const dotenv = require("dotenv");
// const cors = require("cors");
// const morgan = require("morgan");
// const logger = require("./utils/logger");
// const rateLimit = require("express-rate-limit");

// dotenv.config();

// const app = express();
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per window
//   message: "Too many requests from this IP, please try again after 15 minutes",
//   handler: (req, res, next, options) => {
//     logger.error(`Rate limit exceeded by IP: ${req.ip}`); // Log the abuse!
//     res.status(options.statusCode).send(options.message);
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// // 2. Execute the connections
// connectDB(); // Connects to MongoDB
// connectRedis(); // Connects to Redis (This is what's missing!)

// app.use("/api/url/shorten", apiLimiter);
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Your React URL
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//   }),
// );
// // Ensure you have a line like this:
// app.use("/api/url", require("./routes/url"));
// app.use(cors());
// app.use(express.json());
// app.use(
//   morgan("combined", {
//     stream: { write: (message) => logger.info(message.trim()) },
//   }),
// );
// app.use("/api/url/shorten", apiLimiter);
// app.use("/", require("./routes/index"));
// // ... rest of your routes ...

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const rateLimit = require("express-rate-limit");

const app = express();

// 1. DATABASE & CACHE
connectDB();
connectRedis();

// 2. PROXY SETTING (Crucial for Render/Load Balancers)
app.set("trust proxy", 1);

// 3. CORS CONFIGURATION
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 4. MIDDLEWARE
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);
app.use(express.json());

// 5. RATE LIMITER CONFIG
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === "OPTIONS", // Skip preflight requests
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// 6. ROUTES
// Apply the limiter only to the creation of URLs (the "expensive" operation)
app.use("/api/url/shorten", apiLimiter);

app.use("/api/url", require("./routes/url"));
app.use("/", require("./routes/index"));

// 7. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
