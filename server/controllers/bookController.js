const bookService = require("../services/bookService");

/**
 * GET /api/books
 * List books with pagination, search, and filters.
 */
async function listBooks(req, res, next) {
  try {
    const { page, limit, search, category, status, author, publisher, sortBy, sortOrder } = req.query;
    const result = await bookService.listBooks({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      search: search || "",
      category: category || "",
      status: status || "",
      author: author || "",
      publisher: publisher || "",
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/books/:id
 * Get a single book by ID.
 */
async function getBook(req, res, next) {
  try {
    const book = await bookService.getBook(req.params.id);
    res.json(book);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * POST /api/books
 * Create a new book.
 */
async function createBook(req, res, next) {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json({ message: "Book created successfully.", book });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    }
    next(err);
  }
}

/**
 * PUT /api/books/:id
 * Update an existing book.
 */
async function updateBook(req, res, next) {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.json({ message: "Book updated successfully.", book });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    }
    next(err);
  }
}

/**
 * DELETE /api/books/:id
 * Delete a book.
 */
async function deleteBook(req, res, next) {
  try {
    const result = await bookService.deleteBook(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
};