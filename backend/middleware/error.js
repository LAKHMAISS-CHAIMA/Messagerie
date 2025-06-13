// const logger = require('../utils/logger');

// const errorHandler = (err, req, res, next) => {
//     logger.errorWithContext(err, {
//         method: req.method,
//         url: req.url,
//         body: req.body,
//         params: req.params,
//         query: req.query
//     });

//     if (err.name === 'ValidationError') {
//         const errors = Object.values(err.errors).map(error => error.message);
//         return res.status(400).json({
//             error: {
//                 message: 'Validation Error',
//                 details: errors
//             }
//         });
//     }

//     if (err.code === 11000) {
//         return res.status(400).json({
//             error: {
//                 message: 'Duplicate field value entered',
//                 field: Object.keys(err.keyPattern)[0]
//             }
//         });
//     }

//     if (err.name === 'JsonWebTokenError') {
//         return res.status(401).json({
//             error: {
//                 message: 'Invalid token'
//             }
//         });
//     }

//     if (err.name === 'TokenExpiredError') {
//         return res.status(401).json({
//             error: {
//                 message: 'Token expired'
//             }
//         });
//     }

//     res.status(err.status || 500).json({
//         error: {
//             message: err.message || 'Internal Server Error',
//             ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//         }
//     });
// };

// module.exports = errorHandler; 
console.log()
