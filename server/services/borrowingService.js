const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");

/**
 * List borrow records with pagination, search, and filters.
 * Query params: page, limit, search, status, memberType
 */
async function listBorrowRecords({ page = 1, limit = 10, search = "", status = "", memberType = "" }) {
  const filter = {};

  // Search across memberName, bookTitle, memberId, isbn
  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { memberName: { $regex: q, $options: "i" } },
      { bookTitle: { $regex: q, $options: "i" } },
      { memberId: { $regex: q, $options: "i" } },
      { isbn: { $regex: q, $options: "i" } },
    ];
  }

  if (status.trim()) {
    if (status === "active") {
      filter.status = { $in: ["borrowed", "overdue"] };
    } else {
      filter.status = status;
    }
  }

  if (memberType.trim()) {
    filter.memberType = memberType;
  }

  const total = await BorrowRecord.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  const records = await BorrowRecord.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit);

  return {
    records,
    total,
    page: safePage,
    totalPages,
  };
}

/**
 * Get a single borrow record by ID.
 */
async function getBorrowRecord(id) {
  const record = await BorrowRecord.findById(id);
  if (!record) {
    const err = new Error("Borrow record not found.");
    err.statusCode = 404;
    throw err;
  }
  return record;
}

/**
 * Create a new borrow record (issue a book).
 * Validates book availability and member existence.
 */
async function createBorrowRecord(data) {
  const errors = {};

  // Validate required fields
  if (!data.bookId?.trim()) errors.bookId = "Book ID is required.";
  if (!data.bookTitle?.trim()) errors.bookTitle = "Book title is required.";
  if (!data.isbn?.trim()) errors.isbn = "ISBN is required.";
  if (!data.memberId?.trim()) errors.memberId = "Member ID is required.";
  if (!data.memberName?.trim()) errors.memberName = "Member name is required.";
  if (!data.memberType?.trim()) errors.memberType = "Member type is required.";
  if (!data.borrowDate) errors.borrowDate = "Borrow date is required.";
  if (!data.dueDate) errors.dueDate = "Due date is required.";

  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed.");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }

  // Validate memberType enum
  if (!["student", "staff"].includes(data.memberType)) {
    const err = new Error("Invalid member type. Must be 'student' or 'staff'.");
    err.statusCode = 400;
    throw err;
  }

  // Check if book exists and has available copies
  const book = await Book.findById(data.bookId);
  if (!book) {
    const err = new Error("Book not found.");
    err.statusCode = 404;
    throw err;
  }

  if (book.availableCopies < 1) {
    const err = new Error("No available copies for this book.");
    err.statusCode = 400;
    throw err;
  }

  // Check if member already has an active borrow for this book
  const existingBorrow = await BorrowRecord.findOne({
    bookId: data.bookId,
    memberId: data.memberId,
    status: { $in: ["borrowed", "overdue"] },
  });

  if (existingBorrow) {
    const err = new Error("This member already has an active borrow for this book.");
    err.statusCode = 400;
    throw err;
  }

  // Create borrow record
  const recordData = {
    bookId: data.bookId,
    bookTitle: data.bookTitle.trim(),
    bookCoverColor: data.bookCoverColor || "#6D28D9",
    isbn: data.isbn.trim(),
    memberId: data.memberId.trim(),
    memberName: data.memberName.trim(),
    memberType: data.memberType,
    borrowDate: new Date(data.borrowDate),
    dueDate: new Date(data.dueDate),
    status: "borrowed",
  };

  const record = await BorrowRecord.create(recordData);

  // Decrement available copies
  book.availableCopies -= 1;
  await book.save();

  return record;
}

/**
 * Update a borrow record.
 */
async function updateBorrowRecord(id, data) {
  const record = await BorrowRecord.findById(id);
  if (!record) {
    const err = new Error("Borrow record not found.");
    err.statusCode = 404;
    throw err;
  }

  const updatableFields = [
    "bookTitle", "bookCoverColor", "isbn", "memberName", "memberType",
    "borrowDate", "dueDate", "returnDate", "status",
  ];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === "bookTitle" || field === "isbn" || field === "memberName") {
        record[field] = String(data[field]).trim();
      } else if (field === "memberType") {
        if (!["student", "staff"].includes(data[field])) {
          const err = new Error("Invalid member type. Must be 'student' or 'staff'.");
          err.statusCode = 400;
          throw err;
        }
        record[field] = data[field];
      } else if (field === "borrowDate" || field === "dueDate" || field === "returnDate") {
        record[field] = data[field] ? new Date(data[field]) : null;
      } else {
        record[field] = data[field];
      }
    }
  }

  await record.save();
  return record;
}

/**
 * Return a book.
 */
async function returnBook(id, data = {}) {
  const record = await BorrowRecord.findById(id);
  if (!record) {
    const err = new Error("Borrow record not found.");
    err.statusCode = 404;
    throw err;
  }

  if (record.status === "returned") {
    const err = new Error("This book has already been returned.");
    err.statusCode = 400;
    throw err;
  }

  const { condition = "good", notes = "" } = data;

  // Update record
  record.status = "returned";
  record.returnDate = new Date();
  record.condition = condition;
  record.notes = notes;
  await record.save();

  // Increment available copies or adjust total copies if lost
  const book = await Book.findById(record.bookId);
  if (book) {
    if (condition === "lost") {
      book.totalCopies = Math.max(0, book.totalCopies - 1);
    } else {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }
    await book.save();
  }

  return record;
}

/**
 * Get Return Management statistics.
 */
async function getReturnStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const active = await BorrowRecord.countDocuments({ status: "borrowed" });
  const overdue = await BorrowRecord.countDocuments({ status: "overdue" });

  const returnedToday = await BorrowRecord.countDocuments({
    status: "returned",
    returnDate: { $gte: todayStart, $lte: todayEnd },
  });

  return {
    active,
    overdue,
    returnedToday,
  };
}

/**
 * Renew a loan (extend due date).
 */
async function renewLoan(id, dueDate) {
  const record = await BorrowRecord.findById(id);
  if (!record) {
    const err = new Error("Borrow record not found.");
    err.statusCode = 404;
    throw err;
  }

  if (record.status === "returned") {
    const err = new Error("Cannot renew a returned book.");
    err.statusCode = 400;
    throw err;
  }

  if (record.status === "reserved") {
    const err = new Error("Cannot renew a reserved book.");
    err.statusCode = 400;
    throw err;
  }

  // Set new due date
  record.dueDate = new Date(dueDate);
  record.status = "borrowed";
  await record.save();

  return record;
}

/**
 * Delete a borrow record.
 */
async function deleteBorrowRecord(id) {
  const record = await BorrowRecord.findById(id);
  if (!record) {
    const err = new Error("Borrow record not found.");
    err.statusCode = 404;
    throw err;
  }

  // If the book is still borrowed, increment available copies
  if (record.status === "borrowed" || record.status === "overdue") {
    const book = await Book.findById(record.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }
  }

  await BorrowRecord.findByIdAndDelete(id);
  return { message: "Borrow record deleted successfully." };
}

/**
 * Get borrowing history for a specific member.
 * Query params: page, limit, search, status, sortBy, sortOrder
 */
async function getMyBorrowingHistory({ memberId, page = 1, limit = 10, search = "", status = "", sortBy = "borrowDate", sortOrder = "desc" }) {
  const filter = { memberId };

  // Search across bookTitle, isbn
  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { bookTitle: { $regex: q, $options: "i" } },
      { isbn: { $regex: q, $options: "i" } },
    ];
  }

  // Status filter
  if (status.trim()) {
    if (status === "active") {
      filter.status = { $in: ["borrowed", "overdue"] };
    } else {
      filter.status = status;
    }
  }

  const total = await BorrowRecord.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  // Sorting
  const sort = {};
  if (sortBy === "borrowDate") {
    sort.borrowDate = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "dueDate") {
    sort.dueDate = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "returnDate") {
    sort.returnDate = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "bookTitle") {
    sort.bookTitle = sortOrder === "asc" ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const records = await BorrowRecord.find(filter)
    .sort(sort)
    .skip((safePage - 1) * limit)
    .limit(limit);

  return {
    records,
    total,
    page: safePage,
    totalPages,
  };
}

module.exports = {
  listBorrowRecords,
  getBorrowRecord,
  createBorrowRecord,
  updateBorrowRecord,
  returnBook,
  getReturnStats,
  renewLoan,
  deleteBorrowRecord,
  getMyBorrowingHistory,
};
