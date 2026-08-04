const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth");
const applicationRoutes = require("./routes/applications");
const departmentRoutes = require("./routes/departments");
const traineeRoutes = require("./routes/trainee");
const hrRoutes = require("./routes/hr");
const coordinatorRoutes = require("./routes/coordinator");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: env.frontendUrl,
  })
);

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[health] DB connectivity check failed:", err);
    res.status(500).json({ status: "error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes); // public — no requireAuth (REQ-01)
app.use("/api/departments", departmentRoutes); // public — no requireAuth (REQ-28 signup)
app.use("/api/trainee", traineeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/coordinator", coordinatorRoutes);

// Catches errors passed via next(err) from asyncHandler-wrapped routes, so a thrown/rejected
// error becomes a clean 500 instead of a hung request or an unhandled rejection.
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
