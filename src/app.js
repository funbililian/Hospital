const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health Check Route
app.get('/api', (req, res) => {
  res.status(200).json({ message: "Hospital Booking API is running" });
});

module.exports = app;