const request = require("supertest");
const app = require("../src/app");
const Patient = require("../src/models/Patient");
const Doctor = require("../src/models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


describe("Appointments API", () => {
test("POST /api/appointments rejects a request without authentication", async () => {
const response = await request(app)
.post("/api/appointments")
.send({
doctor: "6acc1ac520466b8178a0e486",
date: "2026-10-14",
startTime: "09:00",
endTime: "09:30",
reason: "Routine consultation",
});

expect([401, 403]).toContain(response.status);

});

test("GET /api/appointments rejects a request without authentication", async () => {
const response = await request(app).get("/api/appointments");

expect([401, 403]).toContain(response.status);

});

test("GET /api/appointments/:id rejects a request without authentication", async () => {
const response = await request(app).get(
"/api/appointments/507f1f77bcf86cd799439011"
);

expect([401, 403]).toContain(response.status);

});

test("PATCH /api/appointments/:id/cancel rejects a request without authentication", async () => {
const response = await request(app).patch(
"/api/appointments/507f1f77bcf86cd799439011/cancel"
);

expect([401, 403]).toContain(response.status);

});

test("PATCH /api/appointments/:id/reschedule rejects a request without authentication", async () => {
const response = await request(app).patch(
"/api/appointments/507f1f77bcf86cd799439011/reschedule"
);

expect([401, 403]).toContain(response.status);

});

test("POST /api/appointments books an appointment for an authenticated patient", async () => {
  const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

  const patient = await Patient.create({
    name: "Appointment Test Patient",
    email: "appointment.patient@example.com",
    password: hashedPassword,
    phone: "08012345680",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-test-001",
    name: "Test Doctor",
    specialty: "General Practice",
  });

  const token = jwt.sign(
    { id: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const response = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Routine consultation",
    });

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.data.status).toBe("confirmed");
  expect(response.body.data.doctor.doctorCode).toBe("dr-test-001");
  expect(response.body.data.date).toBe("2026-10-19");
});

test("GET /api/appointments returns the authenticated patient's bookings", async () => {
  const patient = await Patient.create({
    name: "My Appointments Patient",
    email: "my.appointments@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345681",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-test-002",
    name: "Appointments Test Doctor",
    specialty: "General Practice",
  });

  const token = jwt.sign(
    { id: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Routine consultation",
    })
    .expect(201);

  const response = await request(app)
    .get("/api/appointments")
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.count).toBe(1);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0].patient.toString()).toBe(
    patient._id.toString()
  );
});

test("GET /api/appointments/:id returns a single appointment", async () => {
  const patient = await Patient.create({
    name: "Single Appointment Patient",
    email: "single.appointment@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345682",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-test-003",
    name: "Single Appointment Doctor",
    specialty: "General Practice",
  });

  const token = jwt.sign(
    { id: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Follow-up consultation",
    })
    .expect(201);

  const appointmentId = booking.body.data._id;

  const response = await request(app)
    .get(`/api/appointments/${appointmentId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data._id).toBe(appointmentId);
  expect(response.body.data.reason).toBe("Follow-up consultation");
  expect(response.body.data.doctor.doctorCode).toBe("dr-test-003");
});

test("PATCH /api/appointments/:id/cancel cancels the patient's booking", async () => {
  const patient = await Patient.create({
    name: "Cancellation Test Patient",
    email: "cancel.appointment@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345683",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-test-004",
    name: "Cancellation Test Doctor",
    specialty: "General Practice",
  });

  const token = jwt.sign(
    { id: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Routine consultation",
    })
    .expect(201);

  const appointmentId = booking.body.data._id;

  const response = await request(app)
    .patch(`/api/appointments/${appointmentId}/cancel`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.status).toBe("cancelled");
  expect(response.body.data._id).toBe(appointmentId);
});

test("PATCH /api/appointments/:id/reschedule reschedules the patient's booking", async () => {
  const patient = await Patient.create({
    name: "Reschedule Test Patient",
    email: "reschedule.appointment@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345684",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-test-005",
    name: "Reschedule Test Doctor",
    specialty: "General Practice",
  });

  const token = jwt.sign(
    { id: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Routine consultation",
    })
    .expect(201);

  const appointmentId = booking.body.data._id;

  const response = await request(app)
    .patch(`/api/appointments/${appointmentId}/reschedule`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-19",
      startTime: "10:00",
      endTime: "10:30",
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data._id).toBe(appointmentId);
  expect(response.body.data.date).toBe("2026-10-19");
  expect(response.body.data.startTime).toBe("10:00");
  expect(response.body.data.endTime).toBe("10:30");
  expect(response.body.data.status).toBe("rescheduled");
});
test("a patient cannot view another patient's appointment", async () => {
  const patientA = await Patient.create({
    name: "Patient A",
    email: "patient.a.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345001",
  });

  const patientB = await Patient.create({
    name: "Patient B",
    email: "patient.b.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345002",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-security-001",
    name: "Security Test Doctor",
    specialty: "General Practice",
  });

  const tokenA = jwt.sign(
    { id: patientA._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const tokenB = jwt.sign(
    { id: patientB._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${tokenB}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Private consultation",
    })
    .expect(201);

  const response = await request(app)
    .get(`/api/appointments/${booking.body.data._id}`)
    .set("Authorization", `Bearer ${tokenA}`);

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Appointment not found");
});

test("a patient cannot cancel another patient's appointment", async () => {
  const owner = await Patient.create({
    name: "Booking Owner",
    email: "booking.owner.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345003",
  });

  const otherPatient = await Patient.create({
    name: "Other Patient",
    email: "other.patient.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345004",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-security-002",
    name: "Cancellation Security Doctor",
    specialty: "General Practice",
  });

  const ownerToken = jwt.sign(
    { id: owner._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const otherToken = jwt.sign(
    { id: otherPatient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Private consultation",
    })
    .expect(201);

  const response = await request(app)
    .patch(`/api/appointments/${booking.body.data._id}/cancel`)
    .set("Authorization", `Bearer ${otherToken}`);

  expect(response.status).toBe(404);

  const appointments = await request(app)
    .get(`/api/appointments/${booking.body.data._id}`)
    .set("Authorization", `Bearer ${ownerToken}`);

  expect(appointments.status).toBe(200);
  expect(appointments.body.data.status).toBe("confirmed");
});

test("a patient cannot reschedule another patient's appointment", async () => {
  const owner = await Patient.create({
    name: "Reschedule Owner",
    email: "reschedule.owner.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345005",
  });

  const otherPatient = await Patient.create({
    name: "Reschedule Other Patient",
    email: "reschedule.other.security@example.com",
    password: await bcrypt.hash("TestPassword123!", 10),
    phone: "08012345006",
  });

  const doctor = await Doctor.create({
    doctorCode: "dr-security-003",
    name: "Reschedule Security Doctor",
    specialty: "General Practice",
  });

  const ownerToken = jwt.sign(
    { id: owner._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const otherToken = jwt.sign(
    { id: otherPatient._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const booking = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      doctor: doctor.doctorCode,
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "09:30",
      reason: "Private consultation",
    })
    .expect(201);

  const response = await request(app)
    .patch(`/api/appointments/${booking.body.data._id}/reschedule`)
    .set("Authorization", `Bearer ${otherToken}`)
    .send({
      date: "2026-10-19",
      startTime: "10:00",
      endTime: "10:30",
    });

  expect(response.status).toBe(404);

  const appointments = await request(app)
    .get(`/api/appointments/${booking.body.data._id}`)
    .set("Authorization", `Bearer ${ownerToken}`);

  expect(appointments.status).toBe(200);
  expect(appointments.body.data.startTime).toBe("09:00");
  expect(appointments.body.data.status).toBe("confirmed");
});
});