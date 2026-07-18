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

module.exports = {
  getStats,
  getBorrowingActivity,
  getCategoryData,
};