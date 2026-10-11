const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctorController");

// List predefined doctors
router.get("/", doctorController.listDoctors);

// View availability for a specific doctor
router.get(
  "/:id/availability",
  doctorController.getDoctorAvailability
);

// View one doctor
router.get("/:id", doctorController.getDoctor);

module.exports = router;