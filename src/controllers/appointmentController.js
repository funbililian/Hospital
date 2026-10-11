const Appointment = require('../models/Appointment');

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private
 const createAppointment = async (req, res) => {
    try {
        const { doctor, date, startTime, endTime, reason } = req.body;
        const patientId = req.user._id;

        // Check whether the doctor is already booked for this date and time
        const existingBooking = await Appointment.findOne({
            doctor,
            date,
            startTime,
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'This doctor is already booked for this time slot'
            });
        }

        // Create and save the appointment
        const appointment = await Appointment.create({
            patient: patientId,
            doctor,
            date,
            startTime,
            endTime,
            reason,
            status: 'confirmed'
        });

        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: appointment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


// @desc    Get appointments belonging to the logged-in patient
// @route   GET /api/appointments/my-appointments
// @access  Private
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            patient: req.user._id
        }).populate('doctor', 'name specialization');

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This appointment has already been cancelled'
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        return res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


// @desc    Reschedule an appointment
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patient: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'A cancelled appointment cannot be rescheduled'
            });
        }

        const newDate = date || appointment.date;
        const newStartTime = startTime || appointment.startTime;
        const newEndTime = endTime || appointment.endTime;

        // Check whether the new time slot conflicts with another booking
        const existingBooking = await Appointment.findOne({
            doctor: appointment.doctor,
            date: newDate,
            startTime: newStartTime,
            status: { $nin: ['cancelled'] },
            _id: { $ne: appointmentId }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'This doctor is already booked for the new time slot'
            });
        }

        appointment.date = newDate;
        appointment.startTime = newStartTime;
        appointment.endTime = newEndTime;
        appointment.status = 'rescheduled';

        await appointment.save();

        return res.status(200).json({
            success: true,
            message: 'Appointment rescheduled successfully',
            data: appointment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
module.exports = {
    createAppointment,
    getMyAppointments,
    cancelAppointment,
    rescheduleAppointment
};