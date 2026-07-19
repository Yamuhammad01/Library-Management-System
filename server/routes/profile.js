const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

module.exports = router;