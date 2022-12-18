export interface ILoggerSettings {
  kind: 'console' | 'pino' | string;
  appId: string;
}

export type LogFuncType = (msg: string, args?: unknown) => void | Promise<void>;

export interface ILogger {
  debug: LogFuncType;
  info : LogFuncType;
  warn : LogFuncType;
  error: LogFuncType;
}
