const request = require("supertest");
const app = require("../src/app");

describe("Schedules API", () => {
test("GET /api/schedules returns the hospital schedule", async () => {
const response = await request(app).get("/api/schedules");

expect(response.status).toBe(200);
expect(response.body).toBeDefined();

});
});