// const mongoose = require('mongoose');
// const config = require('./config');
// const logger = require('../utils/logger');

// const connectDB = async () => {
//     try {
//         await mongoose.connect(config.MONGODB_URI, {
//         });
        
//         logger.info('Connected to MongoDB');
        
//         mongoose.set('debug', (collectionName, method, query, doc) => {
//             const start = Date.now();
//             const logQuery = () => {
//                 const duration = Date.now() - start;
//                 logger.mongoQuery(method, collectionName, duration, query);
//             };
//             process.nextTick(logQuery);
//         });
//     } catch (err) {
//         logger.errorWithContext(err, { context: 'MongoDB Connection' });
//         process.exit(1);
//     }
// };

// module.exports = connectDB;
console.log()
