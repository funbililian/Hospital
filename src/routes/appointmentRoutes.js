import express from 'express';
import { 
  createAppointment, 
  getMyAppointments, 
  getAppointmentById, 
  cancelAppointment, 
  rescheduleAppointment 
} from '../controllers/appointmentController.js';
import protect from '../middleware/authMiddleware.js'; // Protects routes with user authentication

const router = express.Router();

// Apply auth middleware to all appointment routes
router.use(protect);

router.route('/')
  .post(createAppointment)       // POST /api/appointments - Book appointment
  .get(getMyAppointments);       // GET /api/appointments - View user appointments

router.route('/:id')
  .get(getAppointmentById);      // GET /api/appointments/:id - View single appointment

router.patch('/:id/cancel', cancelAppointment);          // PATCH /api/appointments/:id/cancel - Cancel
router.patch('/:id/reschedule', rescheduleAppointment);    // PATCH /api/appointments/:id/reschedule - Reschedule

export default router;