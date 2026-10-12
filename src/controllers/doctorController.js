
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const hospital = require("../config/hospital");

const {
  parseDate,
  getAvailableSlots
} = require("../utils/availability");

// GET /api/doctors
// Retrieve all doctors from MongoDB
exports.listDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });

    return res.status(200).json({
      hospital: hospital.name,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id
// Retrieve one doctor using their MongoDB ObjectId
exports.getDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid doctor ID."
      });
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    return res.status(200).json({ doctor });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
// Retrieve available appointment slots for a doctor
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid doctor ID."
      });
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (typeof date !== "string" || !parseDate(date)) {
      return res.status(400).json({
        message: "Provide a valid date in YYYY-MM-DD format."
      });
    }

    const slots = await getAvailableSlots(doctor._id, date);

    if (slots === null) {
      return res.status(404).json({
        message: "Unable to retrieve availability for this doctor."
      });
    }

    return res.status(200).json({
      doctor,
      date,
      timezone: hospital.timezone,
      openingTime: hospital.openingTime,
      closingTime: hospital.closingTime,
      slotDurationMinutes: hospital.slotDurationMinutes,
      slots
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/schedules
// Retrieve the hospital's appointment schedule
exports.getHospitalSchedule = (req, res) => {
  return res.status(200).json({
    hospital: hospital.name,
    timezone: hospital.timezone,
    workingDays: hospital.days,
    openingTime: hospital.openingTime,
    closingTime: hospital.closingTime,
    slotDurationMinutes: hospital.slotDurationMinutes
  });
};
