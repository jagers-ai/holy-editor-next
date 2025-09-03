/**
 * Winston 로깅 시스템
 * 환경별 로그 레벨 및 출력 형식 설정
 */

import winston from 'winston';

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
 * 커스텀 로그 포맷
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // 메타데이터가 있으면 추가
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

/**
 * 브라우저용 간단한 로거
 */
class BrowserLogger {
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
      console.error(`[ERROR]: ${message}`, meta);
    }
  }
  
  warn(message: string, meta?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN]: ${message}`, meta);
    }
  }
  
  info(message: string, meta?: any) {
    if (this.shouldLog('info')) {
      console.info(`[INFO]: ${message}`, meta);
    }
  }
  
  debug(message: string, meta?: any) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG]: ${message}`, meta);
    }
  }
}

/**
 * 서버용 Winston 로거 생성
 */
const createServerLogger = () => {
  const transports: winston.transport[] = [];
  
  // 개발 환경: 콘솔 출력
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  } else {
    // 프로덕션: 콘솔 출력 (파일 로깅은 Vercel에서 자동 처리)
    transports.push(
      new winston.transports.Console({
        format: customFormat
      })
    );
  }
  
  return winston.createLogger({
    level: getLogLevel(),
    format: customFormat,
    transports,
    // 처리되지 않은 예외 처리
    exceptionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ],
    // 처리되지 않은 Promise rejection 처리
    rejectionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

/**
 * 환경에 따른 로거 export
 */
export const logger = isBrowser ? new BrowserLogger() : createServerLogger();

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