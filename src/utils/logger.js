// src/utils/logger.js

const morgan = require("morgan");
const requestIp = require("request-ip");

// Custom logging format
morgan.format("custom", (tokens, req, res) => {
  const ip = req.clientIp; // Use request-ip to get the client IP
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const payload = JSON.stringify(req.body);

  return [
    `Request IP: ${ip}`,
    `Request Method: ${method}`,
    `Request URL: ${url}`,
    `Request Payload: ${payload}`,
  ].join(" | ");
});

// Setup morgan logger to use the custom format and log to console
const logger = morgan("custom", {
  stream: {
    write: (message) => console.log(message.trim()), // Log to console
  },
});

// Function to set up request-ip middleware
const setupRequestIpMiddleware = (app) => {
  app.use(requestIp.mw()); // Add middleware to express app
};

module.exports = { logger, setupRequestIpMiddleware }; // Export both
