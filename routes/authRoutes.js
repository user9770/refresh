const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  getMe,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

// Private routes (access token kerak)
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);
router.get("/me", protect, getMe);

module.exports = router;

