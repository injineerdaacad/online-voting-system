import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/dbConfig.js";
import { initSocket } from "./config/socketConfig.js";
import { buildOriginMatcher } from "./utils/corsOriginMatcher.js";
import {
  userRoutes,
  authRoutes,
  sessionRoutes,
  candidateRoutes,
  departmentRoutes,
  electionRoutes,
  facultyRoutes,
  resultRoutes,
  voteRoutes,
  notificationRoutes,
  aiAssistantRoutes,
} from "./routes/index.js";
import "./config/cloudinaryConfig.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const { allowedOriginRules, isAllowedOrigin } = buildOriginMatcher(
  process.env.ALLOWED_ORIGINS || ""
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn(`❌ CORS: Blocked request from origin: ${origin}`);
      console.warn(
        `📋 Configured allowed origins: ${
          allowedOriginRules.length > 0
            ? allowedOriginRules.join(", ")
            : "NONE"
        }`
      );
      console.warn(
        `💡 To fix: Add "${origin}" to ALLOWED_ORIGINS (wildcards supported, e.g. https://online-voting-system-*.vercel.app)`
      );
      return callback(new Error(`CORS policy: Origin ${origin} is not allowed by Access-Control-Allow-Origin policy.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", userRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiAssistantRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/uploads")
  ) {
    const frontendPath = path.join(__dirname, "../frontend/dist/index.html");
    res.sendFile(frontendPath, (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

const parsedPort = Number.parseInt(process.env.PORT || "", 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const HOST = process.env.HOST || "0.0.0.0";
const server = http.createServer(app);

initSocket(server);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error("❌ HTTP server error:", error.message);
  }
  process.exit(1);
});

connectDB()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`✅ Server listening on ${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

export default app;
