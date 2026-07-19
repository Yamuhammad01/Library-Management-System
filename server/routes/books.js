const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const { getFilterOptions } = require("../controllers/bookFiltersController");

// Public read endpoints (authenticated users can browse)
router.get("/filters", authenticate, getFilterOptions);
router.get("/", authenticate, listBooks);
router.get("/:id", authenticate, getBook);

// Write endpoints (Librarian/Admin only)
router.post("/", authenticate, authorize("Librarian", "Admin"), createBook);
router.put("/:id", authenticate, authorize("Librarian", "Admin"), updateBook);
router.delete("/:id", authenticate, authorize("Librarian", "Admin"), deleteBook);

module.exports = router;