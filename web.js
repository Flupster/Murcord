const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.listen(parseInt(process.env.EXPRESS_PORT), () => {
  console.log("[Express] Listening on port :" + process.env.EXPRESS_PORT);
});

module.exports = app;
