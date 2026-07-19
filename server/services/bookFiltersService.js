const Book = require("../models/Book");

/**
 * Get distinct values for filter dropdowns.
 * Returns unique authors, publishers, and categories from the books collection.
 */
async function getFilterOptions() {
  const [authors, publishers, categories] = await Promise.all([
    Book.distinct("author"),
    Book.distinct("publisher"),
    Book.distinct("category"),
  ]);

  return {
    authors: authors.sort(),
    publishers: publishers.sort(),
    categories: categories.sort(),
  };
}

module.exports = {
  getFilterOptions,
};