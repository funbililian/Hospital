module.exports = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(err.errors).map((item) => item.message)
    });
  }

  return res.status(500).json({
    message: "An unexpected server error occurred."
  });
};