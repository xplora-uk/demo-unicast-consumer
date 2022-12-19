import pino from 'pino';
import { ILogger, ILoggerSettings } from './types';

export function newLogger(settings: ILoggerSettings): ILogger {

  const _logger = settings.kind === 'pino' ? pino() : console;

  const ts = () => new Date().toISOString();

  const log = (msg: string, args: unknown = {}): string => {
    let argsJson = '';
    try {
      argsJson = JSON.stringify(args);
    } catch (err) {
      argsJson = 'JSON.stringify(args) failed: ' + (err instanceof Error ? err.message : '');
    }
    return `[${ts()}] [${settings.appId}] ${msg} ${argsJson}`;
  }

  return {
    debug: (msg: string, args?: unknown) => _logger.debug(log(msg, args)),
    info : (msg: string, args?: unknown) => _logger.info(log(msg, args)),
    warn : (msg: string, args?: unknown) => _logger.warn(log(msg, args)),
    error: (msg: string, args?: unknown) => _logger.error(log(msg, args)),
  };
}
