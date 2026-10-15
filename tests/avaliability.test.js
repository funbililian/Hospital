const request = require("supertest");
const app = require("../src/app");
const Patient = require("../src/models/Patient");
const Doctor = require("../src/models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Appointment Availability Validation", () => {
  let token;
  let doctor;

  beforeEach(async () => {
    const password = await bcrypt.hash("TestPassword123!", 10);

    const patient = await Patient.create({
      name: "Availability Test Patient",
      email: "availability-test@example.com",
      password,
      phone: "08012345678",
    });

    doctor = await Doctor.create({
      doctorCode: "dr-availability-001",
      name: "Availability Test Doctor",
      specialty: "General Practice",
    });

    token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
  });

  const bookAppointment = (overrides = {}) =>
    request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctor: "dr-availability-001",
        date: "2026-10-19",
        startTime: "09:00",
        endTime: "09:30",
        reason: "Routine consultation",
        ...overrides,
      });

  test("rejects appointments on Saturday", async () => {
    const response = await bookAppointment({
      date: "2026-10-17",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Monday to Friday/i);
  });

  test("rejects appointments on Sunday", async () => {
    const response = await bookAppointment({
      date: "2026-10-18",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Monday to Friday/i);
  });

  test("rejects appointments on a configured public holiday", async () => {
    const response = await bookAppointment({
      date: "2026-12-25",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Christmas Day/i);
  });

  test("rejects appointments before opening time", async () => {
    const response = await bookAppointment({
      startTime: "07:30",
      endTime: "08:00",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/between 08:00 and 14:00/i);
  });

  test("rejects appointments extending beyond closing time", async () => {
    const response = await bookAppointment({
      startTime: "13:30",
      endTime: "14:30",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/between 08:00 and 14:00/i);
  });

  test("rejects appointments that are not 30 minutes long", async () => {
    const response = await bookAppointment({
      startTime: "09:00",
      endTime: "10:00",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/exactly 30 minutes/i);
  });

  test("rejects start times that do not align with 30-minute slots", async () => {
    const response = await bookAppointment({
      startTime: "09:15",
      endTime: "09:45",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/slot boundaries/i);
  });

  test("rejects an invalid calendar date", async () => {
    const response = await bookAppointment({
      date: "2026-02-30",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/valid date/i);
  });

  test("rejects an incorrectly formatted time", async () => {
    const response = await bookAppointment({
      startTime: "9 AM",
      endTime: "09:30",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/HH:MM format/i);
  });
    test("rejects a second booking for the same doctor and time slot", async () => {
    const firstBooking = await bookAppointment();

    expect(firstBooking.status).toBe(201);

    const secondBooking = await bookAppointment({
      reason: "Another consultation",
    });

    expect(secondBooking.status).toBe(409);
    expect(secondBooking.body.message).toMatch(/already booked/i);
  });

  test("allows different doctors to be booked for the same time slot", async () => {
    const firstBooking = await bookAppointment();

    expect(firstBooking.status).toBe(201);

    await Doctor.create({
      doctorCode: "dr-availability-002",
      name: "Second Availability Doctor",
      specialty: "Cardiology",
    });

    const secondBooking = await bookAppointment({
      doctor: "dr-availability-002",
    });

    expect(secondBooking.status).toBe(201);
  });
    test("rejects rescheduling into another appointment's time slot", async () => {
    const firstBooking = await bookAppointment();
    expect(firstBooking.status).toBe(201);

    const secondBooking = await bookAppointment({
      startTime: "09:30",
      endTime: "10:00",
      reason: "Second consultation",
    });
    expect(secondBooking.status).toBe(201);

    const response = await request(app)
      .patch(`/api/appointments/${secondBooking.body.data._id}/reschedule`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-10-19",
        startTime: "09:00",
        endTime: "09:30",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already booked/i);
  });

  test("allows rescheduling an appointment to an available slot", async () => {
    const booking = await bookAppointment();
    expect(booking.status).toBe(201);

    const response = await request(app)
      .patch(`/api/appointments/${booking.body.data._id}/reschedule`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-10-19",
        startTime: "10:00",
        endTime: "10:30",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("rescheduled");
    expect(response.body.data.startTime).toBe("10:00");
  });
});