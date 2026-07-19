const Book = require("../models/Book");
const Member = require("../models/Member");
const BorrowRecord = require("../models/BorrowRecord");

/**
 * Get summary stats for the dashboard:
 * - Total Books
 * - Active Borrowers (members with at least 1 active loan)
 * - Books Borrowed (currently borrowed)
 * - Overdue Returns
 */
async function getStats() {
  const totalBooks = await Book.countDocuments();

  const activeBorrowers = await BorrowRecord.distinct("memberId", {
    status: { $in: ["borrowed", "overdue"] },
  }).then((ids) => ids.length);

  const booksBorrowed = await BorrowRecord.countDocuments({
    status: { $in: ["borrowed", "overdue"] },
  });

  const overdueReturns = await BorrowRecord.countDocuments({
    status: "overdue",
  });

  return {
    totalBooks,
    activeBorrowers,
    booksBorrowed,
    overdueReturns,
  };
}

/**
 * Get monthly borrowing activity for the chart.
 * Returns an array of { month, borrowed, returned } for the last 12 months.
 */
async function getBorrowingActivity() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
        status: { $ne: "reserved" },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        borrowed: {
          $sum: {
            $cond: [
              { $in: ["$status", ["borrowed", "overdue"]] },
              1,
              0,
            ],
          },
        },
        returned: {
          $sum: {
            $cond: [{ $eq: ["$status", "returned"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ];

  const results = await BorrowRecord.aggregate(pipeline);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Build a map of year+month -> data
  const dataMap = {};
  for (const r of results) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
    dataMap[key] = {
      borrowed: r.borrowed,
      returned: r.returned,
    };
  }

  // Fill in all months in the range
  const activity = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    activity.push({
      m: monthNames[month - 1],
      b: dataMap[key]?.borrowed || 0,
      r: dataMap[key]?.returned || 0,
    });
  }

  return activity;
}

/**
 * Get books borrowed by category for the chart.
 * Returns an array of { name, value } sorted descending.
 */
async function getCategoryData() {
  const pipeline = [
    {
      $match: {
        status: { $in: ["borrowed", "overdue", "returned"] },
      },
    },
    {
      $lookup: {
        from: "books",
        localField: "bookId",
        foreignField: "_id",
        as: "book",
      },
    },
    { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$book.category",
        value: { $sum: 1 },
      },
    },
    { $sort: { value: -1 } },
    {
      $project: {
        _id: 0,
        n: { $ifNull: ["$_id", "Unknown"] },
        v: "$value",
      },
    },
  ];

  return await BorrowRecord.aggregate(pipeline);
}

/**
 * Get member-specific dashboard data for a LibraryMember.
 * Returns stats and lists scoped to the given memberId.
 */
async function getMemberDashboard(memberId) {
  // Currently borrowed books (status: borrowed or overdue)
  const currentlyBorrowed = await BorrowRecord.find({
    memberId,
    status: { $in: ["borrowed", "overdue"] },
  })
    .populate("bookId", "title author coverColor category isbn")
    .sort({ dueDate: 1 })
    .lean();

  // Books due soon (due within 3 days, not yet returned)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const dueSoon = currentlyBorrowed.filter((r) => {
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    return due <= threeDaysFromNow;
  });

  // Active reservations (pending or approved)
  const Reservation = require("../models/Reservation");
  const activeReservations = await Reservation.find({
    memberId,
    status: { $in: ["pending", "approved", "notified"] },
  })
    .populate("bookId", "title author coverColor category isbn")
    .sort({ reservedAt: -1 })
    .lean();

  // Total books borrowed (all time, excluding reserved)
  const totalBorrowed = await BorrowRecord.countDocuments({
    memberId,
    status: { $ne: "reserved" },
  });

  // Recently borrowed books (last 5, including returned)
  const recentlyBorrowed = await BorrowRecord.find({
    memberId,
    status: { $ne: "reserved" },
  })
    .populate("bookId", "title author coverColor category isbn")
    .sort({ borrowDate: -1 })
    .limit(5)
    .lean();

  return {
    currentlyBorrowed,
    dueSoonCount: dueSoon.length,
    dueSoon,
    activeReservations,
    totalBorrowed,
    recentlyBorrowed,
  };
}

module.exports = {
  getStats,
  getBorrowingActivity,
  getCategoryData,
  getMemberDashboard,
};
