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
app.use(express.json({ limit: "4mb" })); // base64 avatars exceed the 100kb default; Vercel caps request bodies at 4.5MB

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

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Server is running',
    data: {
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
  });
});

// Serverless-safe: ensure MongoDB is connected before data routes run.
// The connection is cached in config/db.js, so this is a no-op once connected.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
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

// Start the server only when this file is run directly (npm start / node server.js / port-listener hosts).
// On Vercel the file is imported as a module and the platform handles HTTP, using the export below.
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`Failed to start server: ${err.message}`);
      process.exit(1);
    });
} else {
  // Imported by a host such as Vercel — warm the connection;
  // the middleware above retries on every request if this fails.
  connectDB().catch(() => {});
}

// Export the Express app (Vercel auto-detects this as the module's default export).
module.exports = app;
