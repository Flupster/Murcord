require("dotenv").config();

const mongoose = require("mongoose");

mongoose.set("debug", process.env.MONGO_DEBUG === "true");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("[Mongo] Connected"))
  .catch(console.error);

module.exports = mongoose;
