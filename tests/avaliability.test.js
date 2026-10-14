const request = require("supertest");
const app = require("../src/app");

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
});