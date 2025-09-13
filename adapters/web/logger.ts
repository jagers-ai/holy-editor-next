import { Logger } from '@/ports/logger';

export const consoleLogger: Logger = {
  info: (m, meta) => { try { console.info(m, meta ?? ''); } catch {} },
  warn: (m, meta) => { try { console.warn(m, meta ?? ''); } catch {} },
  error: (m, meta) => { try { console.error(m, meta ?? ''); } catch {} },
};

