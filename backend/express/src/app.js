import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import proctorRoutes from "./routes/proctor.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import studentsRouter from "./routes/students.js";
import adminRoutes from "./routes/admin.routes.js";
import piggybackRoutes from "./routes/piggyback.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "express running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/proctor", proctorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/students", studentsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/piggyback", piggybackRoutes);

app.use(errorHandler);

export default app;