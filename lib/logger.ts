/**
 * 심플한 로깅 시스템
 * Winston 없이 console.log만 사용 (빌드 호환성)
 */

// 브라우저 환경 체크
const isBrowser = typeof window !== 'undefined';

/**
 * 환경별 로그 레벨 결정
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  if (process.env.NODE_ENV === 'production') return 'warn';
  if (process.env.NODE_ENV === 'test') return 'error';
  return 'debug';
};

/**
 * 심플 로거 클래스 (console 기반)
 */
class SimpleLogger {
  private level: string;
  
  constructor() {
    this.level = getLogLevel();
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }
  
  error(message: string, meta?: any) {
    if (this.shouldLog('error')) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [ERROR]: ${message}`, meta || '');
    }
  }
  
  warn(message: string, meta?: any) {
    if (this.shouldLog('warn')) {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [WARN]: ${message}`, meta || '');
    }
  }
  
  info(message: string, meta?: any) {
    if (this.shouldLog('info')) {
      const timestamp = new Date().toISOString();
      console.info(`[${timestamp}] [INFO]: ${message}`, meta || '');
    }
  }
  
  debug(message: string, meta?: any) {
    if (this.shouldLog('debug')) {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG]: ${message}`, meta || '');
    }
  }
}

/**
 * 기본 export는 심플 로거 사용
 */
export const logger = new SimpleLogger();

/**
 * 로거 헬퍼 함수들
 */
export const logError = (error: Error | unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`${context ? `[${context}] ` : ''}${errorMessage}`, {
    stack: errorStack,
    timestamp: new Date().toISOString()
  });
};

export const logWarning = (message: string, metadata?: Record<string, unknown>) => {
  logger.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: Record<string, unknown>) => {
  logger.info(message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, unknown>) => {
  logger.debug(message, metadata);
};

/**
 * 성능 측정 로거
 */
export const logPerformance = (operation: string, duration: number) => {
  const level = duration > 1000 ? 'warn' : 'info';
  const message = `Performance: ${operation} took ${duration}ms`;
  
  if (level === 'warn') {
    logger.warn(message, { duration, operation });
  } else {
    logger.info(message, { duration, operation });
  }
};

/**
 * API 요청 로거
 */
export const logApiRequest = (
  method: string,
  url: string,
  statusCode?: number,
  duration?: number
) => {
  const metadata = {
    method,
    url,
    statusCode,
    duration
  };
  
  if (statusCode && statusCode >= 400) {
    logger.error(`API Error: ${method} ${url} - ${statusCode}`, metadata);
  } else {
    logger.info(`API Request: ${method} ${url}`, metadata);
  }
};

/**
 * 데이터베이스 쿼리 로거
 */
export const logDatabaseQuery = (
  operation: string,
  table: string,
  duration?: number,
  error?: Error
) => {
  const metadata = {
    operation,
    table,
    duration
  };
  
  if (error) {
    logger.error(`Database Error: ${operation} on ${table}`, {
      ...metadata,
      error: error.message
    });
  } else {
    logger.debug(`Database Query: ${operation} on ${table}`, metadata);
  }
};

export default logger;