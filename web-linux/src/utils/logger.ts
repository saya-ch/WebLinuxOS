type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  level: LogLevel
  prefix?: string
  timestamp?: boolean
}

const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  prefix: 'WebLinuxOS',
  timestamp: true
}

const levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

function formatMessage(level: LogLevel, message: string, config: LogConfig): string {
  const parts: string[] = []
  if (config.timestamp) {
    parts.push(`[${new Date().toISOString()}]`)
  }
  if (config.prefix) {
    parts.push(`[${config.prefix}]`)
  }
  parts.push(`[${level.toUpperCase()}]`)
  parts.push(message)
  return parts.join(' ')
}

function shouldLog(level: LogLevel, config: LogConfig): boolean {
  return levelOrder[level] >= levelOrder[config.level]
}

export function createLogger(name: string): Logger {
  return new Logger({ ...DEFAULT_CONFIG, prefix: name })
}

export class Logger {
  private config: LogConfig

  constructor(config?: Partial<LogConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug', this.config)) {
      console.debug(formatMessage('debug', message, this.config), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info', this.config)) {
      console.info(formatMessage('info', message, this.config), ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn', this.config)) {
      console.warn(formatMessage('warn', message, this.config), ...args)
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (shouldLog('error', this.config)) {
      const formatted = formatMessage('error', message, this.config)
      if (error) {
        console.error(formatted, error, ...args)
      } else {
        console.error(formatted, ...args)
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  setPrefix(prefix: string): void {
    this.config.prefix = prefix
  }
}

export const logger = new Logger()

export function logError(message: string, error: unknown): void {
  logger.error(message, error instanceof Error ? error : new Error(String(error)))
}

export function logInfo(message: string): void {
  logger.info(message)
}

export function logWarn(message: string): void {
  logger.warn(message)
}