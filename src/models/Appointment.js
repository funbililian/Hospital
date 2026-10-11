const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient', //links to patient/user model
        required: true
    },
    doctor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor', //links to doctor model
        required: true
    },
    date: {
        type: String, //YYYY-MM-DD format
        required: true
    },
    startTime: {
        type:String, //HH:MM format
        required: true
    },
    endTime: {
        type:String, //HH:MM format
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
        default: 'pending'
    }
}, { timestamps: true});

appointmentSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status:'confirmed' } } );

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;