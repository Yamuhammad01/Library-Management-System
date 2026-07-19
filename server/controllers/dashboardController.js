const dashboardService = require("../services/dashboardService");

/**
 * GET /api/dashboard/stats
 * Returns { totalBooks, activeBorrowers, booksBorrowed, overdueReturns }
 */
async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/activity
 * Returns [{ m, b, r }, ...] for monthly borrowing activity chart
 */
async function getBorrowingActivity(req, res, next) {
  try {
    const activity = await dashboardService.getBorrowingActivity();
    res.json(activity);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/categories
 * Returns [{ n, v }, ...] for books by category chart
 */
async function getCategoryData(req, res, next) {
  try {
    const categories = await dashboardService.getCategoryData();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/member
 * Returns member-specific dashboard data for the authenticated LibraryMember.
 */
async function getMemberDashboard(req, res, next) {
  try {
    const memberId = req.user.memberId;
    if (!memberId) {
      return res.status(400).json({ error: "No member profile linked to this account." });
    }
    const data = await dashboardService.getMemberDashboard(memberId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getBorrowingActivity,
  getCategoryData,
  getMemberDashboard,
};
