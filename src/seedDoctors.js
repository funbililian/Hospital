console.log('Seed script started');

require('dotenv').config();

const mongoose = require('mongoose');
const doctors = require('./config/doctors');
const Doctor = require('./models/Doctor');
 
console.log('Doctor export type:', typeof Doctor);
console.log('Doctor model name:', Doctor.modelName);
console.log(
  'findOneAndUpdate type:',
  typeof Doctor.findOneAndUpdate
);
console.log('Doctors loaded:', doctors.length);
console.log(
    'MongoDB URI exists:',
    Boolean(process.env.MONGO_URI || process.env.MONGODB_URI)
);

async function seedDoctors() {
    try {
        const mongoUri =
            process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error(
                'Missing MONGO_URI or MONGODB_URI in .env'
            );
        }

        await mongoose.connect(mongoUri);
        console.log('MongoDB connected for seeding');

        for (const doctor of doctors) {
            await Doctor.findOneAndUpdate(
                { doctorCode: doctor.id },
                {
                    doctorCode: doctor.id,
                    name: doctor.name,
                    specialty: doctor.specialty
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );
        }

        console.log(
            `${doctors.length} doctors seeded successfully.`
        );
    } catch (error) {
        console.error('Doctor seeding failed:', error);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

seedDoctors();