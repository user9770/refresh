require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

// MongoDB ga ulanish
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Sog'liqni tekshirish
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Auth API ishlamoqda",
    version: "1.0.0",
    endpoints: {
      register: "POST /api/auth/register",
      login:    "POST /api/auth/login",
      logout:   "POST /api/auth/logout",
      logoutAll:"POST /api/auth/logout-all",
      refresh:  "POST /api/auth/refresh-token",
      me:       "GET  /api/auth/me",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route topilmadi: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Kutilmagan server xatosi",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT} da ishlamoqda`);
  console.log(`📡 http://localhost:${PORT}`);
});

