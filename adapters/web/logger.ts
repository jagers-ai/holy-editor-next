import { Logger } from '@/ports/logger';

export const consoleLogger: Logger = {
  info: (m, meta) => {
    try {
      console.info(m, meta ?? '');
    } catch (error) {
      console.warn('consoleLogger.info failed', error);
    }
  },
  warn: (m, meta) => {
    try {
      console.warn(m, meta ?? '');
    } catch (error) {
      console.warn('consoleLogger.warn failed', error);
    }
  },
  error: (m, meta) => {
    try {
      console.error(m, meta ?? '');
    } catch (error) {
      console.warn('consoleLogger.error failed', error);
    }
  },
};
