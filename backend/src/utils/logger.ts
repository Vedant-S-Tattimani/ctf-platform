const level = (msg: string) => `${new Date().toISOString()} ${msg}`;

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(level(`INFO  ${msg}`), meta ?? ''),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(level(`WARN  ${msg}`), meta ?? ''),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(level(`ERROR ${msg}`), meta ?? ''),
};
