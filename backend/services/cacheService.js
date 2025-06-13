const config = require('../config/config');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.memoryCache = new Map();
        logger.info('Cache service initialized with in-memory storage');
    }

    async get(key) {
        return this.memoryCache.get(key) || null;
    }

    async set(key, value, ttl = 3600) {
        this.memoryCache.set(key, value);
        if (ttl) {
            setTimeout(() => {
                this.memoryCache.delete(key);
            }, ttl * 1000);
        }
        return true;
    }

    async del(key) {
        this.memoryCache.delete(key);
        return true;
    }

    async cacheRoomMessages(roomCode, messages) {
        const key = `room:${roomCode}:messages`;
        return this.set(key, messages);
    }

    async getRoomMessages(roomCode) {
        const key = `room:${roomCode}:messages`;
        return this.get(key);
    }

    async invalidateRoomCache(roomCode) {
        const key = `room:${roomCode}:messages`;
        return this.del(key);
    }

    async cacheActiveUser(userId, socketId) {
        const key = `user:${userId}:socket`;
        return this.set(key, socketId, 3600); 
    }

    async getActiveUserSocket(userId) {
        const key = `user:${userId}:socket`;
        return this.get(key);
    }

    async removeActiveUser(userId) {
        const key = `user:${userId}:socket`;
        return this.del(key);
    }

    async clearCache() {
        this.memoryCache.clear();
        logger.info('Cache cleared');
        return true;
    }
}

const cacheService = new CacheService();
module.exports = cacheService;