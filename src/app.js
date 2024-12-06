const express = require("express");
require("dotenv").config();
// require("./db/connection");
const cors = require("cors");
const { logger, setupRequestIpMiddleware } = require("./utils/logger"); // Import the logger and setup function
const mmdbRouter = require("./Routes/mmdbRouter");
const morgan = require("morgan");

const app = express();

app.use(express.json());

// Setup request IP middleware
setupRequestIpMiddleware(app); // Ensure request-ip middleware is set up first

app.use(logger); // Use the logger

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // Log to console in development
}
app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}`);
  console.log(`Request URL: ${req.originalUrl}`);
  console.log(`Query Params: ${JSON.stringify(req.query)}`); // Log query parameters
  console.log(`Request Payload: ${JSON.stringify(req.body)}`);
  next();
});

// app.get("/connection", (req, res) => {
//   res.status(200).send("connected");
// });

app.use("/api/location", mmdbRouter);

app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
