const reservationService = require("../services/reservationService");

/**
 * GET /api/reservations
 * List reservations with pagination, search, and filters.
 */
async function listReservations(req, res, next) {
  try {
    const { page, limit, search, status, memberType } = req.query;
    const result = await reservationService.listReservations({
      page:       parseInt(page)  || 1,
      limit:      parseInt(limit) || 10,
      search:     search     || "",
      status:     status     || "",
      memberType: memberType || "",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations/stats
 * Get stat card data.
 */
async function getReservationStats(req, res, next) {
  try {
    const stats = await reservationService.getReservationStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations/:id
 * Get a single reservation.
 */
async function getReservation(req, res, next) {
  try {
    const record = await reservationService.getReservation(req.params.id);
    res.json(record);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * POST /api/reservations
 * Create a new reservation.
 */
async function createReservation(req, res, next) {
  try {
    const record = await reservationService.createReservation(req.body);
    res.status(201).json({ message: "Reservation created successfully.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/approve
 */
async function approveReservation(req, res, next) {
  try {
    const record = await reservationService.approveReservation(req.params.id);
    res.json({ message: "Reservation approved.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/reject
 */
async function rejectReservation(req, res, next) {
  try {
    const { reason = "" } = req.body;
    const record = await reservationService.rejectReservation(req.params.id, reason);
    res.json({ message: "Reservation rejected.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/cancel
 */
async function cancelReservation(req, res, next) {
  try {
    const record = await reservationService.cancelReservation(req.params.id);
    res.json({ message: "Reservation cancelled.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/complete
 */
async function markCompleted(req, res, next) {
  try {
    const record = await reservationService.markCompleted(req.params.id);
    res.json({ message: "Reservation marked as completed.", record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * POST /api/reservations/notify-next/:bookId
 * Notify the next member in the queue for a given book.
 */
async function notifyNextMember(req, res, next) {
  try {
    const record = await reservationService.notifyNextMember(req.params.bookId);
    res.json({ message: `Member '${record.memberName}' has been notified.`, record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

/**
 * DELETE /api/reservations/:id
 */
async function deleteReservation(req, res, next) {
  try {
    const result = await reservationService.deleteReservation(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}

module.exports = {
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
};
