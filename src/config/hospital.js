const hospitalSchedule = {
  name: "Hospital Appointment Booking",
  timezone: "Africa/Lagos",
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  openingTime: "08:00",
  closingTime: "14:00",
  slotDurationMinutes: 30,

  publicHolidays: [
    {
      date: "2026-10-01",
      name: "Independence Day"
    },
    {
      date: "2026-12-25",
      name: "Christmas Day"
    },
    {
      date: "2026-12-26",
      name: "Boxing Day"
    },
    {
      date: "2026-01-01",
      name: "New Year's Day"
    },
    {
      date: "2026-06-12",
      name: "Democracy Day"
    }
  ]
};

module.exports = hospitalSchedule;
