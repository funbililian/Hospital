require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "hospital_test",
    serverSelectionTimeoutMS: 10000,
  });
}, 15000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;

  for (const collection of Object.values(
    mongoose.connection.collections
  )) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});