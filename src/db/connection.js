const mongoose = require("mongoose");
const { MONGO_URL } = require("../utils/constants");

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connected to Db"))
  .catch((err) => console.log("connection failed due to " + err.message));
