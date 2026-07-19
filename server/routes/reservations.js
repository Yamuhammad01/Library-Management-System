const express = require("express");
const router  = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  listReservations,
  getReservationStats,
  getReservation,
  createReservation,
  approveReservation,
  rejectReservation,
  cancelReservation,
  markCompleted,
  notifyNextMember,
  deleteReservation,
} = require("../controllers/reservationController");

// All reservation routes require authentication
router.use(authenticate);

// Stats endpoint — Librarian + Admin
router.get("/stats", authorize("Librarian", "Admin"), getReservationStats);

// Notify next in queue for a book — Librarian only
router.post("/notify-next/:bookId", authorize("Librarian", "Admin"), notifyNextMember);

// Standard CRUD — Librarian + Admin
router.use(authorize("Librarian", "Admin"));

router.get("/",    listReservations);
router.get("/:id", getReservation);
router.post("/",   createReservation);

// Status transitions
router.patch("/:id/approve",  approveReservation);
router.patch("/:id/reject",   rejectReservation);
router.patch("/:id/cancel",   cancelReservation);
router.patch("/:id/complete", markCompleted);

// Admin-only: hard delete
router.delete("/:id", authorize("Admin"), deleteReservation);

module.exports = router;
