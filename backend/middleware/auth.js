// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const config = require('../config/config');

// const authMiddleware = async (req, res, next) => {
//   try {
//     let token;

//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }
//     else if (req.cookies.token) {
//       token = req.cookies.token;
//     }

//     if (!token) {
//       return res.status(401).json({
//         error: {
//           message: 'Not authorized to access this route',
//           status: 401
//         }
//       });
//     }

//     try {
//       const decoded = jwt.verify(token, config.JWT_SECRET);

//       const user = await User.findById(decoded.id).select('-password');

//       if (!user) {
//         return res.status(401).json({
//           error: {
//             message: 'User not found',
//             status: 401
//           }
//         });
//       }

//       req.user = user;
//       next();
//     } catch (err) {
//       return res.status(401).json({
//         error: {
//           message: 'Not authorized to access this route',
//           status: 401
//         }
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       error: {
//         message: 'Server Error',
//         status: 500
//       }
//     });
//   }
// };

// module.exports = authMiddleware;
console.log()
