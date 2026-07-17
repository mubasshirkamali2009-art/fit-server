require("dotenv").config();
const express = require("express");
const cors = require("cors");

const usersRouter = require("./src/routes/users");
const profileRouter = require("./src/routes/profile");
const nutritionRouter = require("./src/routes/nutrition");
const aiRouter = require("./src/routes/ai");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (progress photos stored on disk)
app.use("/uploads", express.static("uploads"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users", usersRouter);
app.use("/api/profile", profileRouter);
app.use("/api/nutrition", nutritionRouter);
app.use("/api/ai", aiRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FitTracker API running on http://localhost:${PORT}`);
});
