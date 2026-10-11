import Appointment from '../models/appointmentModel.js';

// description: Book an appointment
// route: POST /api/appointments
//private access
export const createAppointment = async (req, res) => {
    try {
        const { doctore, date, startTime, endTime, reason } = req.body;
        const patientId = req.user._id;
        //check if doctor is already booked for the exact day and time
        const existingBooking = await Appointment.findOne({
            doctor,
            date,
            startTime,
            status: { $ne: 'cancelled'} //Ignore cancelled appointments
        });

        if (existingBooking) {
            return res.status(404).json({
                success: false,
                message: 'This doctor is already booked for this time slot'
            });
        }
        //Create and save appointments
        const appointment = await Appointment.create({
        patient: patientId,
        doctor,
        date,
        startTime,
        endTime,
        reason,
        status: 'confirmed'
        });

    res.status(201).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

//view appointments belonging to user
//route: GET /api/appointments/my-appointments
//private access

export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id }).populate('doctor', 'name specialization');
        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    }catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

//cancel an appointment
//route: PATCH /api/appointments/:id/cancel
//private access
export const cancelAppointment = async (req, res) => {
    try{
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patirnt: req.user._id
        });
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: Appointment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
};

//Reschedule an appointment
//route PATCH /api/appointments/:id/reschedule
//private access
export const rescheduleAppointment = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patient: req.user._id
        });

        if(!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found '});
        }

        // Check if the new slot is already booked for that doctor
    if (date && startTime) {
      const existingBooking = await Appointment.findOne({
        doctor: appointment.doctor,
        date,
        startTime,
        status: { $ne: 'cancelled' },
        _id: { $ne: appointmentId }
      });

      if (existingBooking) {
        return res.status(400).json({ 
          success: false, 
          message: 'This doctor is already booked for the new time slot.' 
        });
      }
    }

    appointment.date = date || appointment.date;
    appointment.startTime = startTime || appointment.startTime;
    appointment.endTime = endTime || appointment.endTime;
    appointment.status = 'rescheduled';

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
