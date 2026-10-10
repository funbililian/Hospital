# Hospital

Project 

Suggested API list

Base URL: http://localhost:5000/api

A. Authentication APIs
POST - /auth/register - Register a new user
POST - /auth/login - Log in a user
GET - /auth/me - View one profile needs JWT auth

B. Appointment APIs
POST - /appointments - Book an appointment
GET-  /appointments - View appointments belonging to the logged-in user
GET - /appointments/:id - View one of their appointment
PATCH - /appointments/:id/cancel - Cancel an appointment
PATCH - /appointments/:id/reschedule - Reschedule an appointment

C. Schedule and availability
GET - /doctors - List available doctors
GET - /doctors/:id/availability?date=YYYY-MM-DD - View a doctor's available slots
GET - /schedules - View hospital business hours

D. Doctor availability
GET - /doctors - list predefined doctors
GET - /doctors/:id - View a doctor 
GET - /doctors/:id/availability?date=2026-10-12 - view available slot

File Structure 


hospital-appointment-booking/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── hospital.js
│   │   └── doctors.js
│   ├── models/
│   │   ├── Patient.js
│   │   └── Appointment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   └── appointmentController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── appointmentRoutes.js
│   ├── utils/
│   │   └── availability.js
│   ├── app.js
│   └── server.js
├── tests/
├── .env
├── .gitignore
├── package.json
└── README.md


What each model stores
Model Important fields
●	Patient.js : name, email, password, phone
●	Doctor.js : list of names, specialty
●	Appointment.js : patient, doctor, date, startTime, endTime, reason, status
●	Schedule.js : dayOfWeek, openingTime, closingTime, slotDuration
●	Hospital.js : name of hospital, time zone, opening and closing hours

Project Checklist 
[ ] Initialize Express and connect MongoDB
[ ] Configure hospital hours and doctor list
[ ] Create Patient and Appointment models
[ ] Implement registration, login and JWT middleware
[ ] Implement doctor listing and availability
[ ] Implement appointment booking and auto-confirmation
[ ] Implement listing, cancellation and rescheduling
[ ] Test ownership, invalid hours and duplicate bookings in Postman
[ ] Write README with setup instructions and API documentation

