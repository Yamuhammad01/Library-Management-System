const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  listBorrowRecords,
  getBorrowRecord,
  createBorrowRecord,
  updateBorrowRecord,
  returnBook,
  renewLoan,
  deleteBorrowRecord,
} = require("../controllers/borrowingController");

// All borrowing routes require authentication + Librarian/Admin role
router.use(authenticate);
router.use(authorize("Librarian", "Admin"));

router.get("/", listBorrowRecords);
router.get("/:id", getBorrowRecord);
router.post("/", createBorrowRecord);
router.put("/:id", updateBorrowRecord);
router.post("/:id/return", returnBook);
router.post("/:id/renew", renewLoan);
router.delete("/:id", deleteBorrowRecord);

module.exports = router;