const Book = require("../models/Book");

/**
 * List books with pagination, search, and filters.
 * Query params: page, limit, search, category, status
 */
async function listBooks({ page = 1, limit = 10, search = "", category = "", status = "" }) {
  const filter = {};

  // Search across title, author, isbn
  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { author: { $regex: q, $options: "i" } },
      { isbn: { $regex: q, $options: "i" } },
    ];
  }

  if (category.trim()) {
    filter.category = category;
  }

  if (status.trim()) {
    filter.status = status;
  }

  const total = await Book.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  const books = await Book.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit);

  return {
    books,
    total,
    page: safePage,
    totalPages,
  };
}

/**
 * Get a single book by ID.
 */
async function getBook(id) {
  const book = await Book.findById(id);
  if (!book) {
    const err = new Error("Book not found.");
    err.statusCode = 404;
    throw err;
  }
  return book;
}

/**
 * Create a new book with validation.
 */
async function createBook(data) {
  const errors = {};
  if (!data.isbn?.trim()) errors.isbn = "ISBN is required.";
  if (!data.title?.trim()) errors.title = "Title is required.";
  if (!data.author?.trim()) errors.author = "Author is required.";
  if (!data.category?.trim()) errors.category = "Category is required.";
  if (!data.publisher?.trim()) errors.publisher = "Publisher is required.";
  if (!data.shelfLocation?.trim()) errors.shelfLocation = "Shelf location is required.";
  if (!data.totalCopies || isNaN(Number(data.totalCopies)) || Number(data.totalCopies) < 1) {
    errors.totalCopies = "Total copies must be a positive number.";
  }

  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed.");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }

  // Check duplicate ISBN
  const existing = await Book.findOne({ isbn: data.isbn.trim() });
  if (existing) {
    const err = new Error("A book with this ISBN already exists.");
    err.statusCode = 409;
    throw err;
  }

  const bookData = {
    isbn: data.isbn.trim(),
    title: data.title.trim(),
    author: data.author.trim(),
    category: data.category,
    publisher: data.publisher.trim(),
    year: Number(data.year) || new Date().getFullYear(),
    edition: data.edition?.trim() || "",
    pages: Number(data.pages) || 0,
    language: data.language || "English",
    description: data.description?.trim() || "",
    shelfLocation: data.shelfLocation.trim(),
    totalCopies: Number(data.totalCopies),
    availableCopies: Number(data.availableCopies ?? data.totalCopies),
    borrowCount: Number(data.borrowCount) || 0,
    coverColor: data.coverColor || "#6D28D9",
  };

  const book = await Book.create(bookData);
  return book;
}

/**
 * Update an existing book.
 */
async function updateBook(id, data) {
  const book = await Book.findById(id);
  if (!book) {
    const err = new Error("Book not found.");
    err.statusCode = 404;
    throw err;
  }

  // Check ISBN uniqueness if changing ISBN
  if (data.isbn && data.isbn.trim() !== book.isbn) {
    const dup = await Book.findOne({ isbn: data.isbn.trim(), _id: { $ne: id } });
    if (dup) {
      const err = new Error("A book with this ISBN already exists.");
      err.statusCode = 409;
      throw err;
    }
  }

  const updatableFields = [
    "isbn", "title", "author", "category", "publisher", "year",
    "edition", "pages", "language", "description", "shelfLocation",
    "totalCopies", "availableCopies", "borrowCount", "coverColor",
  ];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      book[field] = field === "isbn" || field === "title" || field === "author" || field === "publisher" || field === "edition" || field === "description" || field === "shelfLocation"
        ? String(data[field]).trim() || book[field]
        : field === "year" || field === "pages" || field === "totalCopies" || field === "availableCopies" || field === "borrowCount"
        ? Number(data[field])
        : data[field];
    }
  }

  // The pre-save hook will auto-compute status
  await book.save();
  return book;
}

/**
 * Delete a book by ID.
 */
async function deleteBook(id) {
  const book = await Book.findByIdAndDelete(id);
  if (!book) {
    const err = new Error("Book not found.");
    err.statusCode = 404;
    throw err;
  }
  return { message: "Book deleted successfully." };
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
};