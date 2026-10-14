
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");

describe("MongoDB connection", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test(
    "connects to the hospital_test database",
    async () => {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "hospital_test",
        serverSelectionTimeoutMS: 10000,
      });

      expect(mongoose.connection.readyState).toBe(1);
    },
    15000
  );
});
