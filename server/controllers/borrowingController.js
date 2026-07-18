const borrowingService = require("../services/borrowingService");

/**
 * GET /api/borrowing
 * List borrow records with pagination, search, and filters.
 */
async function listBorrowRecords(req, res, next) {
  try {
    const { page, limit, search, status, memberType } = req.query;
    const result = await borrowingService.listBorrowRecords({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || "",
      status: status || "",
      memberType: memberType || "",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/borrowing/:id
 * Get a single borrow record by ID.
 */
async function getBorrowRecord(req, res, next) {
  try {
    const record = await borrowingService.getBorrowRecord(req.params.id);
    res.json(record);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * POST /api/borrowing
 * Create a new borrow record (issue a book).
 */
async function createBorrowRecord(req, res, next) {
  try {
    const record = await borrowingService.createBorrowRecord(req.body);
    res.status(201).json({ message: "Book issued successfully.", record });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    }
    next(err);
  }
}

/**
 * PUT /api/borrowing/:id
 * Update a borrow record.
 */
async function updateBorrowRecord(req, res, next) {
  try {
    const record = await borrowingService.updateBorrowRecord(req.params.id, req.body);
    res.json({ message: "Borrow record updated successfully.", record });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    }
    next(err);
  }
}

/**
 * POST /api/borrowing/:id/return
 * Return a book.
 */
async function returnBook(req, res, next) {
  try {
    const record = await borrowingService.returnBook(req.params.id);
    res.json({ message: "Book returned successfully.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * POST /api/borrowing/:id/renew
 * Renew a loan.
 */
async function renewLoan(req, res, next) {
  try {
    const { dueDate } = req.body;
    if (!dueDate) {
      return res.status(400).json({ error: "Due date is required for renewal." });
    }
    const record = await borrowingService.renewLoan(req.params.id, dueDate);
    res.json({ message: "Loan renewed successfully.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * DELETE /api/borrowing/:id
 * Delete a borrow record.
 */
async function deleteBorrowRecord(req, res, next) {
  try {
    const result = await borrowingService.deleteBorrowRecord(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  listBorrowRecords,
  getBorrowRecord,
  createBorrowRecord,
  updateBorrowRecord,
  returnBook,
  renewLoan,
  deleteBorrowRecord,
};