const express = require("express");
const contactRoutes = require("./routes/routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const connectDB = require("./db");
connectDB();


app.use(express.json());
app.use("/api", contactRoutes);


app.get("/", (req, res) => {
    res.send("Bitespeed Identity API is running!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
