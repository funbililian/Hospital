const express = require("express");
const errorMiddleware = require("./middleware/errorMiddleware");
console.log("authRoutes:", typeof require("./routes/authRoutes"));
console.log("doctorRoutes:", typeof require("./routes/doctorRoutes"));
console.log("appointmentRoutes:", typeof require("./routes/appointmentRoutes"));
console.log("scheduleRoutes:", typeof require("./routes/scheduleRoutes"));
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "hospital-appointment-booking"
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorMiddleware);

module.exports = app;