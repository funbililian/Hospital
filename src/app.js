
const express = require("express");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "hospital-appointment-booking"
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/schedules", require("./routes/scheduleRoutes"));

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

app.use(errorMiddleware);

module.exports = app;
