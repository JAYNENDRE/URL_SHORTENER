const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json(),
  ),
  transports: [
    // 1. Log errors to a specific file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // 2. Log everything to a combined file
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
    // 3. Log to the console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

module.exports = logger;
