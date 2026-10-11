const doctors = require("../config/doctors");
const hospital = require("../config/hospital");

const {
  parseDate,
  getAvailableSlots
} = require("../utils/availability");

// GET /api/doctors
exports.listDoctors = (req, res) => {
  res.status(200).json({
    hospital: hospital.name,
    count: doctors.length,
    doctors
  });
};

// GET /api/doctors/:id
exports.getDoctor = (req, res) => {
  const doctor = doctors.find(
    (item) => item.id === req.params.id
  );

  if (!doctor) {
    return res.status(404).json({
      message: "Doctor not found."
    });
  }

  return res.status(200).json({ doctor });
};

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const doctor = doctors.find((item) => item.id === id);

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

    const slots = await getAvailableSlots(id, date);

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
exports.getHospitalSchedule = (req, res) => {
  return res.status(200).json({
    hospital: hospital.name,
    timezone: hospital.timezone,
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    openingTime: hospital.openingTime,
    closingTime: hospital.closingTime,
    slotDurationMinutes: hospital.slotDurationMinutes
  });
};