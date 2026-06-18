const express = require("express");
const cors = require("cors");
const temperatureRouter = require("./routes/temperature");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/temperature", temperatureRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
