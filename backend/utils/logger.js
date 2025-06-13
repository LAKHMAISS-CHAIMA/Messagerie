const config = require('../config/config');

class Logger {
  constructor() {
    this.logLevel = config.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context
    };
    return JSON.stringify(logEntry, null, 2);
  }

  error(message, context = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  errorWithContext(error, context = {}) {
    const errorContext = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    };
    this.error('Error occurred', errorContext);
  }

  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  debug(message, context = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  mongoQuery(method, collection, duration, query = {}) {
    if (this.shouldLog('debug')) {
      this.debug('MongoDB Query', {
        method,
        collection,
        duration: `${duration}ms`,
        query: JSON.stringify(query)
      });
    }
  }

  httpRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      this.warn('HTTP Request', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  socket(event, data = {}) {
    this.info('Socket Event', {
      event,
      ...data
    });
  }
}

module.exports = new Logger();