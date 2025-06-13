require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 7777,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:7777',
    
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/messenger',
    MONGODB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    },
    
    SOCKET_CORS: {
        origin: process.env.CLIENT_URL || 'http://localhost:7777',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    SOCKET_PING_TIMEOUT: 60000,
    SOCKET_PING_INTERVAL: 25000,
    
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, 
    RATE_LIMIT_MAX: 100, 
    
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
    
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_COOKIE_EXPIRES_IN: 24 * 60 * 60 * 1000,
    
    ROOM_CODE_LENGTH: 6,
    MAX_ROOM_PARTICIPANTS: 2,
    ROOM_INACTIVE_TIMEOUT: 24 * 60 * 60 * 1000,
    
    MAX_MESSAGE_LENGTH: 1000,
    MESSAGE_CLEANUP_AGE: 30 * 24 * 60 * 60 * 1000, 
    
    CACHE_TTL: 3600,
    
    SECURITY_HEADERS: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    }
}; 