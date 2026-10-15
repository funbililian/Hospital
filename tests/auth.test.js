
const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

describe("Authentication API", () => {
  test("POST /api/auth/register creates a patient and returns a token", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Patient",
        email: "test.patient@example.com",
        password: "TestPassword123!",
        phone: "08012345678",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.name).toBe("Test Patient");
    expect(response.body.email).toBe("test.patient@example.com");
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
  });
  test("POST /api/auth/login authenticates a registered patient", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Login Test Patient",
        email: "login.patient@example.com",
        password: "TestPassword123!",
        phone: "08012345679",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login.patient@example.com",
        password: "TestPassword123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("login.patient@example.com");
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
  });
    test("GET /api/auth/me rejects a request without a token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  test("GET /api/auth/me rejects a malformed token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value");

    expect(response.status).toBe(401);
  });

  test("GET /api/auth/me rejects an expired token", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/expired|invalid/i);
  });

  test("GET /api/auth/me rejects a token signed with the wrong secret", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      "this-is-the-wrong-secret"
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
