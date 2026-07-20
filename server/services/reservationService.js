const Reservation = require("../models/Reservation");
const Book = require("../models/Book");

/* ─────────────────────────── HELPERS ─────────────────────────── */
function makeErr(msg, code = 400) {
  const e = new Error(msg);
  e.statusCode = code;
  return e;
}

/* ─────────────────────────── LIST ────────────────────────────── */
/**
 * List reservations with pagination, search, and filters.
 * @param {object} opts
 */
async function listReservations({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  memberType = "",
  memberId = "",
} = {}) {
  const filter = {};

  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { memberName:  { $regex: q, $options: "i" } },
      { bookTitle:   { $regex: q, $options: "i" } },
      { memberId:    { $regex: q, $options: "i" } },
      { isbn:        { $regex: q, $options: "i" } },
      { memberEmail: { $regex: q, $options: "i" } },
    ];
  }

  if (status.trim()) filter.status = status;
  if (memberType.trim()) filter.memberType = memberType;
  if (memberId.trim()) filter.memberId = memberId;

  const total      = await Reservation.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage   = Math.min(Math.max(1, page), totalPages);

  const records = await Reservation.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit);

  return { records, total, page: safePage, totalPages };
}

/* ─────────────────────────── STATS ───────────────────────────── */
/**
 * Get counts for each status + expiring-soon count for stat cards.
 */
async function getReservationStats() {
  const [total, pending, approved, rejected, cancelled, completed, notified] = await Promise.all([
    Reservation.countDocuments(),
    Reservation.countDocuments({ status: "pending" }),
    Reservation.countDocuments({ status: "approved" }),
    Reservation.countDocuments({ status: "rejected" }),
    Reservation.countDocuments({ status: "cancelled" }),
    Reservation.countDocuments({ status: "completed" }),
    Reservation.countDocuments({ status: "notified" }),
  ]);

  // Reservations expiring within 24 hours (still pending/approved)
  const soon = new Date();
  soon.setHours(soon.getHours() + 24);
  const expiringSoon = await Reservation.countDocuments({
    status: { $in: ["pending", "approved"] },
    expiresAt: { $lte: soon },
  });

  return { total, pending, approved, rejected, cancelled, completed, notified, expiringSoon };
}

/* ─────────────────────────── GET ONE ─────────────────────────── */
async function getReservation(id) {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  return record;
}

/* ─────────────────────────── CREATE ──────────────────────────── */
/**
 * Create a new reservation.
 * Validates: book exists, member doesn't already have an active reservation for this book.
 */
async function createReservation(data) {
  const errors = {};
  if (!data.bookId)      errors.bookId      = "Book ID is required.";
  if (!data.bookTitle)   errors.bookTitle   = "Book title is required.";
  if (!data.memberId)    errors.memberId    = "Member ID is required.";
  if (!data.memberName)  errors.memberName  = "Member name is required.";
  if (!data.memberType)  errors.memberType  = "Member type is required.";

  if (Object.keys(errors).length) {
    const e = makeErr("Validation failed.", 400);
    e.errors = errors;
    throw e;
  }

  if (!["student", "staff"].includes(data.memberType)) {
    throw makeErr("Invalid member type. Must be 'student' or 'staff'.", 400);
  }

  // Check book exists
  const book = await Book.findById(data.bookId);
  if (!book) throw makeErr("Book not found.", 404);

  // Check for duplicate active reservation
  const existing = await Reservation.findOne({
    bookId:   data.bookId,
    memberId: data.memberId,
    status:   { $in: ["pending", "approved", "notified"] },
  });
  if (existing) throw makeErr("This member already has an active reservation for this book.", 400);

  // Assign queue position (max position among active reservations for this book + 1)
  const lastInQueue = await Reservation.findOne(
    { bookId: data.bookId, status: { $in: ["pending", "notified"] } },
    { position: 1 },
    { sort: { position: -1 } }
  );
  const position = lastInQueue ? lastInQueue.position + 1 : 1;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.holdDays || 7));

  const record = await Reservation.create({
    bookId:         data.bookId,
    bookTitle:      String(data.bookTitle).trim(),
    bookCoverColor: data.bookCoverColor || "#6D28D9",
    isbn:           data.isbn || "",
    memberId:       String(data.memberId).trim(),
    memberName:     String(data.memberName).trim(),
    memberEmail:    data.memberEmail || "",
    memberType:     data.memberType,
    notes:          data.notes || "",
    position,
    expiresAt,
  });

  return record;
}

/* ─────────────────────────── APPROVE ─────────────────────────── */
async function approveReservation(id) {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  if (!["pending", "notified"].includes(record.status)) {
    throw makeErr(`Cannot approve a reservation with status '${record.status}'.`, 400);
  }
  record.status     = "approved";
  record.approvedAt = new Date();
  await record.save();
  return record;
}

/* ─────────────────────────── REJECT ──────────────────────────── */
async function rejectReservation(id, reason = "") {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  if (!["pending", "notified"].includes(record.status)) {
    throw makeErr(`Cannot reject a reservation with status '${record.status}'.`, 400);
  }
  record.status          = "rejected";
  record.rejectionReason = reason;
  await record.save();
  return record;
}

/* ─────────────────────────── CANCEL ──────────────────────────── */
async function cancelReservation(id) {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  if (["completed", "rejected", "cancelled"].includes(record.status)) {
    throw makeErr(`Cannot cancel a reservation with status '${record.status}'.`, 400);
  }
  record.status = "cancelled";
  await record.save();
  return record;
}

/* ─────────────────────── MEMBER SELF-SERVICE ─────────────────── */
/**
 * Create a reservation for the authenticated member.
 * Enforces the rule: members cannot reserve books that are currently available.
 * Member info comes from the JWT (req.user), not the request body.
 */
async function reserveForSelf({
  bookId,
  memberId,
  memberName,
  memberEmail = "",
  memberType = "student",
}) {
  if (!bookId) throw makeErr("Book ID is required.", 400);

  // Book must exist
  const book = await Book.findById(bookId);
  if (!book) throw makeErr("Book not found.", 404);

  // Members cannot reserve books that are currently available
  if (book.availableCopies > 0) {
    throw makeErr("This book is currently available — please borrow it instead.", 400);
  }

  // Delegate to the shared creation logic (handles dup-check + queue position)
  return createReservation({
    bookId:        book._id.toString(),
    bookTitle:     book.title,
    bookCoverColor: book.coverColor || "#6D28D9",
    isbn:          book.isbn || "",
    memberId,
    memberName,
    memberEmail,
    memberType,
  });
}

/**
 * Cancel a reservation owned by the authenticated member.
 * Enforces ownership: members can only cancel their own reservations.
 */
async function cancelMyReservation(id, memberId) {
  if (!id) throw makeErr("Reservation ID is required.", 400);
  if (!memberId) throw makeErr("Member ID is required.", 400);

  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);

  if (record.memberId !== memberId) {
    throw makeErr("You can only cancel your own reservations.", 403);
  }
  if (["completed", "rejected", "cancelled"].includes(record.status)) {
    throw makeErr(`Cannot cancel a reservation with status '${record.status}'.`, 400);
  }

  record.status = "cancelled";
  await record.save();
  return record;
}

/* ─────────────────────── MARK COMPLETED ──────────────────────── */
/**
 * Mark a reservation as completed (book picked up / issued).
 * Decrements book.availableCopies by 1 since the reservation converts to a loan.
 */
async function markCompleted(id) {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  if (record.status !== "approved") {
    throw makeErr("Only approved reservations can be marked as completed.", 400);
  }

  record.status      = "completed";
  record.completedAt = new Date();
  await record.save();

  // Decrement book's available copies (book is now being issued to this member)
  const book = await Book.findById(record.bookId);
  if (book && book.availableCopies > 0) {
    book.availableCopies -= 1;
    await book.save();
  }

  return record;
}

/* ─────────────────────── NOTIFY NEXT MEMBER ──────────────────── */
/**
 * Notifies the next member in the queue for a given book.
 * Finds the lowest-position "pending" reservation for bookId and marks it as "notified".
 */
async function notifyNextMember(bookId) {
  if (!bookId) throw makeErr("Book ID is required.", 400);

  const nextReservation = await Reservation.findOne(
    { bookId, status: "pending" },
    null,
    { sort: { position: 1, createdAt: 1 } }
  );

  if (!nextReservation) {
    throw makeErr("No pending reservations found for this book.", 404);
  }

  nextReservation.status     = "notified";
  nextReservation.notifiedAt = new Date();
  await nextReservation.save();

  return nextReservation;
}

/* ─────────────────────────── DELETE ──────────────────────────── */
async function deleteReservation(id) {
  const record = await Reservation.findById(id);
  if (!record) throw makeErr("Reservation not found.", 404);
  await Reservation.findByIdAndDelete(id);
  return { message: "Reservation deleted successfully." };
}

module.exports = {
  listReservations,
  getReservationStats,
  getReservation,
  createReservation,
  approveReservation,
  rejectReservation,
  cancelReservation,
  reserveForSelf,
  cancelMyReservation,
  markCompleted,
  notifyNextMember,
  deleteReservation,
};
