const dotenv = require("dotenv");
dotenv.config();

const express = require("express");

const connectDB = require("./config/db.config");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;