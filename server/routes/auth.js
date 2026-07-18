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

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, changePassword);

module.exports = router;