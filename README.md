# Hospital Appointment Booking API

A REST API for a hospital appointment booking system. Patients can create an account, authenticate, browse doctors, check appointment availability, book visits, and manage their appointments. The service uses the hospital's configured operating hours and Africa/Lagos time zone when calculating appointment slots.

## Features

- Patient registration and login with bcrypt password hashing.
- JWT-based authentication for patient profile and appointment routes.
- Doctor directory backed by MongoDB and populated from a predefined seed list.
- Doctor availability generated in 30-minute slots during hospital operating hours.
- Availability rules for weekdays, public holidays, past dates, and already-booked times.
- Appointment booking, listing, viewing, cancellation, and rescheduling.
- Ownership checks so patients can access only their own appointments.
- A health endpoint for checking that the API process is responding.

## Technology

- Node.js and Express 5
- MongoDB and Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `dotenv` for environment variables

## Project structure

```text
.
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── doctors.js            # Predefined doctors used by the seed script
│   │   └── hospital.js           # Hospital hours, time zone, and holidays
│   ├── controllers/
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   └── doctorController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── Doctor.js
│   │   └── Patient.js
│   ├── routes/
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── scheduleRoutes.js
│   ├── utils/
│   │   └── availability.js       # Date, time, and slot helpers
│   ├── app.js                   # Express app and route mounting
│   ├── seedDoctors.js            # Upserts predefined doctors into MongoDB
│   └── server.js                 # Environment checks, DB startup, and listener
├── postman/
│   └── globals/
│       └── workspace.globals.yaml
├── .postman/
│   └── resources.yaml
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## Requirements

- Node.js and npm
- A MongoDB database, local or hosted

## Getting started

1. Clone the repository and enter its directory:

   ```bash
   git clone https://github.com/funbililian/Hospital.git
   cd Hospital
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/hospital
   JWT_SECRET=replace-this-with-a-random-secret-at-least-32-characters-long
   PORT=5000
   ```

   `MONGODB_URI` must point to a reachable MongoDB database. `JWT_SECRET` must be at least 32 characters; the server checks this before connecting. `PORT` is optional and defaults to `5000`. Keep real secrets in `.env` and do not commit that file.

4. Seed the doctor directory:

   ```bash
   node src/seedDoctors.js
   ```

   The seed script reads `MONGODB_URI` (it also accepts `MONGO_URI`) and upserts the doctors in `src/config/doctors.js` by their doctor code. It can be run again without creating duplicate doctors.

5. Start the API:

   ```bash
   npm run dev
   ```

   For a normal start without Nodemon, use:

   ```bash
   npm start
   ```

The API listens on `http://localhost:5000` by default. The base path for application endpoints is `/api`.

## Hospital schedule and booking rules

The current configuration in `src/config/hospital.js` is:

- Time zone: `Africa/Lagos`
- Working days: Monday to Friday
- Opening time: `08:00`
- Closing time: `14:00`
- Slot length: 30 minutes
- Configured public holidays: dates listed in `publicHolidays`

Appointment dates use `YYYY-MM-DD`; times use 24-hour `HH:MM`. Appointments must fall within the configured opening hours and align with a 30-minute slot. Past dates and configured holidays are rejected. Availability for today excludes slots whose start time has already passed in Lagos time.

The holiday list is currently hard-coded in `src/config/hospital.js` and must be maintained as dates change.

## API reference

All request and response bodies use JSON. The examples use `http://localhost:5000` as the server URL.

### Health

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Returns the process health status. |

Example response:

```json
{
  "status": "ok",
  "service": "hospital-appointment-booking"
}
```

### Authentication

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create a patient account. |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT. |
| `GET` | `/api/auth/me` | Bearer token | Return the authenticated patient's profile. |

#### Register

`POST /api/auth/register`

Required fields: `name`, `email`, `password`, and `phone`.

```json
{
  "name": "Ada Okafor",
  "email": "ada@example.com",
  "password": "your-password",
  "phone": "+2348000000000"
}
```

A successful registration returns the patient's ID, name, email, phone, and a JWT. Passwords are hashed before they are stored.

#### Log in

`POST /api/auth/login`

```json
{
  "email": "ada@example.com",
  "password": "your-password"
}
```

A successful login returns the patient details and a JWT that expires after 30 days. Use the token on protected endpoints:

```http
Authorization: Bearer <token>
```

#### Current patient

`GET /api/auth/me` returns the authenticated patient's profile. The password field is excluded from the profile loaded by the authentication middleware.

### Doctors and availability

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/api/doctors` | No | List doctors stored in MongoDB. |
| `GET` | `/api/doctors/:id` | No | Get one doctor by MongoDB `_id`. |
| `GET` | `/api/doctors/:id/availability?date=YYYY-MM-DD` | No | Get available slots for one doctor and date. |
| `GET` | `/api/schedules` | No | Get the configured hospital schedule. |

The doctor list is loaded from the `Doctor` collection. Each seeded doctor has a `doctorCode` such as `dr-001`, a name, and a specialty. Doctor detail and availability URLs use the doctor's MongoDB `_id`; appointment booking uses the `doctorCode` in its request body.

Example availability request:

```http
GET /api/doctors/<doctor-mongodb-id>/availability?date=2026-10-14
```

The response includes the doctor, requested date, time zone, opening and closing times, slot length, and an array of available `{ "startTime", "endTime" }` slots. An invalid doctor ID or date returns a client error; a valid date on a non-working day, holiday, or past date returns no available slots.

`GET /api/schedules` returns the hospital name, time zone, working days, opening and closing times, and slot duration.

### Appointments

All appointment endpoints require a valid patient JWT. A patient can only list, view, cancel, or reschedule appointments that belong to that patient.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/appointments` | Book an appointment. |
| `GET` | `/api/appointments` | List the authenticated patient's appointments. |
| `GET` | `/api/appointments/:id` | View one of the patient's appointments. |
| `PATCH` | `/api/appointments/:id/cancel` | Cancel an appointment. |
| `PATCH` | `/api/appointments/:id/reschedule` | Change its date or time. |

#### Book an appointment

`POST /api/appointments`

```json
{
  "doctor": "dr-001",
  "date": "2026-10-14",
  "startTime": "08:00",
  "endTime": "08:30",
  "reason": "General consultation"
}
```

The `doctor` field is a doctor code from the seeded directory. A successful booking returns HTTP `201` and an appointment with the doctor details populated. New bookings are created with status `confirmed`.

The API rejects invalid dates or times, dates in the past, configured public holidays, non-working days, times outside hospital hours, durations that are not exactly one slot, misaligned start times, unknown doctors, and overlapping appointments. A booking conflict returns HTTP `409`.

#### List and view appointments

`GET /api/appointments` returns the authenticated patient's appointments ordered by date and start time. `GET /api/appointments/:id` returns one appointment only if it belongs to the authenticated patient. Appointment IDs are MongoDB document IDs.

#### Cancel an appointment

`PATCH /api/appointments/:id/cancel`

No request body is required. The patient must own the appointment. Cancelled or completed appointments cannot be cancelled again. A successful cancellation changes the status to `cancelled`.

#### Reschedule an appointment

`PATCH /api/appointments/:id/reschedule`

Provide the new date and time. Each field may be omitted to keep its current value:

```json
{
  "date": "2026-10-15",
  "startTime": "09:00",
  "endTime": "09:30"
}
```

The same date, time, holiday, operating-hour, slot-boundary, and conflict checks apply. Cancelled or completed appointments cannot be rescheduled. The current implementation sets the appointment status to `rescheduled` after a successful change.


## Data models

- **Patient:** name, unique email, hashed password, phone, and Mongoose timestamps.
- **Doctor:** unique doctor code, name, specialty, and Mongoose timestamps.
- **Appointment:** patient and doctor references, date, start and end times, reason, status, and timestamps.

Appointment status values in the schema are `pending`, `confirmed`, `completed`, `cancelled`, and `rescheduled`. The booking endpoint currently creates appointments as `confirmed`.

## Errors

Responses are JSON. Typical client errors include:

- `400` for invalid input, date/time rules, or malformed IDs.
- `401` when authentication is missing, invalid, expired, or the patient no longer exists.
- `404` when a doctor or the patient's appointment cannot be found.
- `409` when an appointment overlaps an existing booking.
- `500` for unexpected server or database errors.

The exact response body depends on the endpoint; error responses generally include a `message` field, and appointment responses include a `success` flag.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Nodemon. |
| `npm start` | Start the server with Node.js. |
| `node src/seedDoctors.js` | Upsert the predefined doctor directory. |

There is no automated test script configured in `package.json` yet.
