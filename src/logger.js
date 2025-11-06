import pino from 'pino'

/**
 * Creates a Pino logger instance with standard configuration
 * @param {Object} options - Logger options
 * @param {string} options.level - Log level (default: 'info')
 * @param {boolean} options.pretty - Enable pretty printing for development
 * @returns {pino.Logger} Configured logger instance
 */
export function create_logger({ level = 'info', pretty = false } = {}) {
  const config = {
    level,
    formatters: {
      level: label => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (pretty) {
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
  }

  return pino(config)
}

// Default logger instance
export const logger = create_logger({
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV !== 'production',
})
