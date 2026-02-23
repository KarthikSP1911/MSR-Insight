import dotenv from "dotenv";
dotenv.config();

import express from "express";

import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);

app.use(errorHandler);

export default app;