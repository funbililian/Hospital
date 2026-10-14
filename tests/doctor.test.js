const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Doctor = require("../src/models/Doctor");

describe("Doctors API", () => {
  beforeEach(async () => {
    await Doctor.create([
      {
        doctorCode: "dr-001",
        name: "Dr. Ada Okafor",
        specialty: "Family Medicine"
      },
      {
        doctorCode: "dr-002",
        name: "Dr. Chidi Eze",
        specialty: "Endocrinology"
      }
    ]);
  });

  test("GET /api/doctors returns all doctors", async () => {
    const response = await request(app).get("/api/doctors");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.doctors).toHaveLength(2);
  });

  test("GET /api/doctors/:id returns one doctor", async () => {
    const doctor = await Doctor.findOne({ doctorCode: "dr-001" });

    const response = await request(app)
      .get(`/api/doctors/${doctor._id}`);

    expect(response.status).toBe(200);
    expect(response.body.doctor.name).toBe("Dr. Ada Okafor");
  });

  test("GET /api/doctors/:id returns 400 for an invalid ID", async () => {
    const response = await request(app)
      .get("/api/doctors/not-a-valid-object-id");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid doctor ID.");
  });

  test("GET /api/doctors/:id returns 404 for a valid but nonexistent ID", async () => {
    const nonexistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/doctors/${nonexistentId}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Doctor not found.");
  });
});