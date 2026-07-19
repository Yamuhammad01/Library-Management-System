const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getStats,
  getBorrowingActivity,
  getCategoryData,
  getMemberDashboard,
} = require("../controllers/dashboardController");

router.get("/stats", getStats);
router.get("/activity", getBorrowingActivity);
router.get("/categories", getCategoryData);
router.get("/member", authenticate, authorize("LibraryMember"), getMemberDashboard);

module.exports = router;
