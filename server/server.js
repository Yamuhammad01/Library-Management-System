require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const borrowingRoutes = require("./routes/borrowing");
const reservationRoutes = require("./routes/reservations");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m';
    console.log(`${statusColor}[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms\x1b[0m`);
  });
  
  next();
});

// Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrowing", borrowingRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/profile", profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
