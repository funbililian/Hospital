
require('dotenv').config();
console.log("MongoDB URI loaded in server:", Boolean(process.env.MONGODB_URI));
const app = require('./app');
const connectDB = require('./config/db');

connectDB();

const PORT = process.env.PORT || 5000;
const atlas_string = process.env.MONGODB_URI;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});