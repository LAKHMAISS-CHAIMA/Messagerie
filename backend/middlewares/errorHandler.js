const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
};

module.exports = errorHandler;