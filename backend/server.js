process.removeAllListeners('warning');
process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
        return;
    }
    console.warn(warning);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const logger = require('./utils/logger');
const socketService = require('./services/socket');
const Room = require('./models/Room');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            upgradeInsecureRequests: []
        }
    }
}));

app.use(cors(config.SOCKET_CORS));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));

app.use((err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const message = config.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(err.status || 500).json({
        status: 'error',
        message
    });
});

const connectWithRetry = async (retries = 5, delay = 5000) => {
    try {
        console.log('Attempting to connect to MongoDB at:', config.MONGODB_URI);
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        logger.info('Connected to MongoDB');
        
        socketService.init(server);
        
        server.listen(config.PORT, () => {
            logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
        });

        const cleanupInterval = 24 * 60 * 60 * 1000; 
        setInterval(async () => {
            try {
                const [roomsCleaned, messagesCleaned] = await Promise.all([
                    Room.cleanInactiveRooms(),
                    Message.cleanOldMessages()
                ]);
                logger.info('Periodic cleanup completed', {
                    roomsCleaned,
                    messagesCleaned
                });
            } catch (error) {
                logger.error('Periodic cleanup error:', error);
            }
        }, cleanupInterval);

    } catch (err) {
        console.error('MongoDB connection error:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        
        if (retries > 0) {
            logger.warn(`MongoDB connection failed. Retrying in ${delay/1000} seconds... (${retries} retries left)`);
            setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
            logger.error('MongoDB connection failed after all retries:', err);
            process.exit(1);
        }
    }
};

connectWithRetry();

const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });

    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));