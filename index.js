const express = require("express");
const convertFileRouter = require("./Routes/conversionRoute");
require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/upload", convertFileRouter);

app.get("*", async (req, res) => {
  res.send(
    "Welcome to File Merger API's, Sorry but you have reached to wrong endpoint, Please check your endpoint"
  );
});

app.listen(PORT, (err) => {
  if (err) {
    console.log("Error running server", err.message);
  } else {
    console.log(`Server running on PORT: ${PORT}`);
  }
});
