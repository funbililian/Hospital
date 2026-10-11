const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Patient', patientSchema);