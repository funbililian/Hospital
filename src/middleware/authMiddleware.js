
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Not authorized, no token',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');

      return res.status(500).json({
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const patient = await Patient.findById(decoded.id).select('-password');

    if (!patient) {
      return res.status(401).json({
        message: 'Not authorized, patient not found',
      });
    }

    req.user = patient;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError' ||
        error.name === 'NotBeforeError') {
      return res.status(401).json({
        message: 'Not authorized, invalid or expired token',
      });
    }

    console.error(error);

    return res.status(500).json({
      message: 'Server error during authentication',
    });
  }
};

module.exports =  { protect } ;
