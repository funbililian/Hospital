const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const hospital = require('../config/hospital');
// Populate doctor details for API responses
const populateDoctor = (query) =>
    query.populate('doctor', 'doctorCode name specialty');

// Validate appointment date and time

const validateAppointmentDetails = (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) {
        return 'Date, start time, and end time are required';
    }

    // Validate YYYY-MM-DD and ensure it is a real calendar date.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return 'Date must use YYYY-MM-DD format';
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        return 'Please provide a valid date';
    }

    // Use Nigeria's local calendar date for past-date validation.
    const todayParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const todayValues = Object.fromEntries(
        todayParts.map(({ type, value }) => [type, value])
    );

    const today =
        `${todayValues.year}-${todayValues.month}-${todayValues.day}`;

    if (date < today) {
        return 'Appointments cannot be booked in the past';
    }

    // Reject public holidays.
    const holiday = hospital.publicHolidays.find(
        (item) => item.date === date
    );

    if (holiday) {
        return `The hospital is closed on ${holiday.name}`;
    }

    // Reject Saturdays and Sundays.
    const weekday = parsedDate.getUTCDay();
    const weekdayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    const dayName = weekdayNames[weekday];

    if (!hospital.days.includes(dayName)) {
        return 'Appointments are available Monday to Friday only';
    }

    // Validate 24-hour HH:MM format.
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
        return 'Time must use HH:MM format';
    }

    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const openingMinutes = toMinutes(hospital.openingTime);
    const closingMinutes = toMinutes(hospital.closingTime);
    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    const slotDuration = hospital.slotDurationMinutes;

    // Enforce opening and closing hours.
    if (
        startMinutes < openingMinutes ||
        endMinutes > closingMinutes
    ) {
        return `Appointments must be between ${hospital.openingTime} and ${hospital.closingTime}`;
    }

    if (endMinutes <= startMinutes) {
        return 'End time must be later than start time';
    }

    // Each appointment must occupy exactly one slot.
    if (endMinutes - startMinutes !== slotDuration) {
        return `Appointments must be exactly ${slotDuration} minutes long`;
    }

    // Start times must align with the hospital's slot boundaries.
    if ((startMinutes - openingMinutes) % slotDuration !== 0) {
        return `Appointments must start on ${slotDuration}-minute slot boundaries`;
    }

    return null;
};

// Check whether a doctor has an overlapping appointment
const findOverlappingAppointment = ({
    doctorId,
    date,
    startTime,
    endTime,
    excludeId
}) => {
    const query = {
        doctor: doctorId,
        date,
        status: { $nin: ['cancelled', 'completed'] },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Appointment.findOne(query);
};

// @route POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        const { doctor, date, startTime, endTime, reason } = req.body;
        const patientId = req.user._id;

        if (!mongoose.isValidObjectId(patientId)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authenticated patient'
            });
        }

        if (!doctor || !reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Doctor and reason are required'
            });
        }

        const validationError = validateAppointmentDetails(
            date,
            startTime,
            endTime
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // The API accepts a code such as "dr-016".
        const selectedDoctor = await Doctor.findOne({
            doctorCode: doctor
        });

        if (!selectedDoctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        const existingBooking = await findOverlappingAppointment({
            doctorId: selectedDoctor._id,
            date,
            startTime,
            endTime
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: 'This doctor is already booked for an overlapping time slot'
            });
        }

        const appointment = await Appointment.create({
            patient: patientId,
            doctor: selectedDoctor._id,
            date,
            startTime,
            endTime,
            reason: reason.trim(),
            status: 'confirmed'
        });

        await appointment.populate('doctor', 'doctorCode name specialty');

        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: appointment
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This doctor is already booked for that start time'
            });
        }

        console.error('Create appointment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @route GET /api/appointments
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await populateDoctor(
            Appointment.find({ patient: req.user._id })
        ).sort({ date: 1, startTime: 1 });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @route GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
    try {
        const appointment = await populateDoctor(
            Appointment.findOne({
                _id: req.params.id,
                patient: req.user._id
            })
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }

        console.error('Get appointment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @route PATCH /api/appointments/:id/cancel
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

        if (['cancelled', 'completed'].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `A ${appointment.status} appointment cannot be cancelled`
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();
        await appointment.populate('doctor', 'doctorCode name specialty');

        return res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }

        console.error('Cancel appointment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @route PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;

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

        if (['cancelled', 'completed'].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `A ${appointment.status} appointment cannot be rescheduled`
            });
        }

        const newDate = date || appointment.date;
        const newStartTime = startTime || appointment.startTime;
        const newEndTime = endTime || appointment.endTime;

        const validationError = validateAppointmentDetails(
            newDate,
            newStartTime,
            newEndTime
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const existingBooking = await findOverlappingAppointment({
            doctorId: appointment.doctor,
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            excludeId: appointment._id
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: 'This doctor is already booked for an overlapping time slot'
            });
        }

        appointment.date = newDate;
        appointment.startTime = newStartTime;
        appointment.endTime = newEndTime;
        appointment.status = 'rescheduled';

        await appointment.save();
        await appointment.populate('doctor', 'doctorCode name specialty');

        return res.status(200).json({
            success: true,
            message: 'Appointment rescheduled successfully',
            data: appointment
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This doctor is already booked for that start time'
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }

        console.error('Reschedule appointment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    createAppointment,
    getMyAppointments,
    getAppointmentById,
    cancelAppointment,
    rescheduleAppointment
};
