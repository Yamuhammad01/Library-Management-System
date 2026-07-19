const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  listBorrowRecords,
  getBorrowRecord,
  createBorrowRecord,
  borrowForSelf,
  updateBorrowRecord,
  returnBook,
  getReturnStats,
  renewLoan,
  deleteBorrowRecord,
} = require("../controllers/borrowingController");

// All borrowing routes require authentication
router.use(authenticate);

// Return management endpoints (Librarian only)
router.get("/return-stats", authorize("Librarian"), getReturnStats);
router.post("/:id/return", authorize("Librarian"), returnBook);

// Member self-service borrowing (LibraryMembers can borrow for themselves)
router.post("/self", borrowForSelf);

// General borrowing routes require authentication + Librarian/Admin role
router.use(authorize("Librarian", "Admin"));

router.get("/", listBorrowRecords);
router.get("/:id", getBorrowRecord);
router.post("/", createBorrowRecord);
router.put("/:id", updateBorrowRecord);
router.post("/:id/renew", renewLoan);
router.delete("/:id", deleteBorrowRecord);

module.exports = router;