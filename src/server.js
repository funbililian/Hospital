
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Configure a JWT_SECRET of at least 32 characters.");
  }

  await connectDB();

  const Appointment = require('./models/Appointment');
console.log(
    'Appointment model file:',
    require.resolve('./models/Appointment')
);

console.log(
    'Doctor field type:',
    Appointment.schema.path('doctor').instance
);
  console.log("Appointment type:", typeof Appointment);
  console.log("Appointment.init type:", typeof Appointment.init);
  console.log("Appointment model name:", Appointment.modelName);

  if (typeof Appointment.init !== "function") {
    throw new Error(
      "Appointment is not a valid Mongoose model. Check its export and import."
    );
  }

  // Ensure the booking index is initialized before serving requests.
  await Appointment.init();

  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  return server;
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
