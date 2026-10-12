const hospital = require("../config/hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

function parseDate(dateString) {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function getLagosDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: hospital.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getLagosTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: hospital.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date());
}

function isWorkingDay(date) {
  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const dayName = weekdayNames[date.getUTCDay()];
  const workingDays = hospital.days || hospital.workingDays || [];

  return workingDays.includes(dayName);
}

// NEW: Check whether a date is a public holiday.
function isPublicHoliday(dateString) {
  return (hospital.publicHolidays || []).some((holiday) => {
    // Supports either "YYYY-MM-DD" strings or holiday objects.
    const holidayDate =
      typeof holiday === "string" ? holiday : holiday.date;

    return holidayDate === dateString;
  });
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(remainder).padStart(2, "0")
  );
}

function getAllSlots() {
  const opening = timeToMinutes(hospital.openingTime);
  const closing = timeToMinutes(hospital.closingTime);
  const duration = hospital.slotDurationMinutes;

  const slots = [];

  for (
    let start = opening;
    start + duration <= closing;
    start += duration
  ) {
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + duration)
    });
  }

  return slots;
}

async function getAvailableSlots(doctorId, dateString) {
  const doctor = await Doctor.findById(doctorId);
  const date = parseDate(dateString);

  if (!doctor || !date) {
    return null;
  }

  if (isPublicHoliday(dateString)) {
    return [];
  }

  if (!isWorkingDay(date)) {
    return [];
  }

  const today = getLagosDate();

  if (dateString < today) {
    return [];
  }

  const appointments = await Appointment.find({
    doctor: doctorId,
    date: dateString,
    status: "confirmed"
  }).select("startTime");

  const bookedTimes = new Set(
    appointments.map((appointment) => appointment.startTime)
  );

  const allSlots = getAllSlots();

  return allSlots.filter((slot) => {
    const isBooked = bookedTimes.has(slot.startTime);

    const hasPassed =
      dateString === today && slot.startTime <= getLagosTime();

    return !isBooked && !hasPassed;
  });
}

module.exports = {
  parseDate,
  getLagosDate,
  getLagosTime,
  isWorkingDay,
  isPublicHoliday,
  timeToMinutes,
  minutesToTime,
  getAllSlots,
  getAvailableSlots
};