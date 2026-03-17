// const client = redis.createClient({
//   url: "redis://127.0.0.1:6379",
// });
// const redis = require("redis");
// const client = redis.createClient({
//   url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
// });

// client.on("error", (err) => console.log("Redis Client Error", err));

// const connectRedis = async () => {
//   try {
//     await client.connect();
//     console.log("Redis Connected Successfully!"); // This is the line you want to see
//   } catch (err) {
//     console.error("Redis Connection Failed:", err);
//   }
// };

// module.exports = { client, connectRedis };
const redis = require("redis");
const logger = require("../utils/logger");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  // This is the CRITICAL part for Graceful Degradation
  socket: {
    connectTimeout: 3000, // Wait only 3 seconds
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        // Stop retrying after 3 attempts so the app can move on
        return new Error("Redis connection failed permanently");
      }
      return 500; // Retry every 500ms
    },
  },
});

client.on("error", (err) => {
  // Use Winston to log the error instead of crashing
  logger.error("Redis Client Error:", err.message);
});

const connectRedis = async () => {
  try {
    // Using a promise race or short-circuit to prevent hanging
    await client.connect();
    console.log("Redis Connected Successfully!");
  } catch (err) {
    logger.error("Redis connection failed, continuing with MongoDB only.");
  }
};

module.exports = { client, connectRedis };
