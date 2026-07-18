const express = require("express");
const router = express.Router();
const {
  getStats,
  getBorrowingActivity,
  getCategoryData,
} = require("../controllers/dashboardController");

router.get("/stats", getStats);
router.get("/activity", getBorrowingActivity);
router.get("/categories", getCategoryData);

module.exports = router;