import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import proctorRoutes from "./routes/proctor.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import studentsRouter from "./routes/students.js";
import adminRoutes from "./routes/admin.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// Trust Cloud Run's reverse proxy / load balancer
app.set('trust proxy', 1);

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Strict CORS policy
const allowedOrigins = [
    "http://localhost:3000", 
    "https://msr-frontend-754411699176.us-central1.run.app"
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// 3. Rate Limiting to prevent brute-force
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window`
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, forwardedHeader: false },
});
app.use("/api/", apiLimiter);

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

app.use(errorHandler);

export default app;