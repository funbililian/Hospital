
const express = require("express");

const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
} = require("../controllers/appointmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all appointment routes
router.use(protect);

// POST /api/appointments - Book appointment
// GET  /api/appointments - View logged-in user's appointments
router
  .route("/")
  .post(createAppointment)
  .get(getMyAppointments);

// GET /api/appointments/:id - View one appointment
router.route("/:id").get(getAppointmentById);

// PATCH /api/appointments/:id/cancel - Cancel appointment
router.patch("/:id/cancel", cancelAppointment);

// PATCH /api/appointments/:id/reschedule - Reschedule appointment
router.patch("/:id/reschedule", rescheduleAppointment);

module.exports = router;
