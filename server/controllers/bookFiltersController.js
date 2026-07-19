const bookFiltersService = require("../services/bookFiltersService");

/**
 * GET /api/books/filters
 * Returns distinct authors, publishers, categories for filter dropdowns.
 */
async function getFilterOptions(req, res, next) {
  try {
    const options = await bookFiltersService.getFilterOptions();
    res.json(options);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFilterOptions,
};