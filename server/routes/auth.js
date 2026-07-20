const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  logout,
  changePassword,
} = require("../controllers/authController");

// Zero-trust: disable caching on all auth routes to prevent stale role data
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, changePassword);

module.exports = router;
