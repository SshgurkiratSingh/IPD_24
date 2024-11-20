const express = require("express");
const app = express();
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors()); // Use cors middleware here
app.use(express.json());

const port = 2500; // or any other port number you want to use
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/v1", require("./routes/llmChat"));
app.use("/api/v2", require("./routes/automationPanel"));
app.use("/api/v3", require("./routes/history"));
app.use("/api/v4", require("./routes/cctvChat"));

app.listen(2500, "0.0.0.0", () => {
  console.log(`Server is online at port ${port}!`);
  console.log(`http://localhost:${port}`);
});
