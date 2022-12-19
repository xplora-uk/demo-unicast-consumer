import { Application, Request, Response } from 'express';
import { IConfig } from '../config/types';
import { ILogger } from '../loggers/types';
import { IUnicastConsumer } from '../unicast-consumers/types';

export interface IFactory {
  app        : Application;
  config     : IConfig;
  healthCheck: (req: Request, res: Response) => void | Promise<void>;
  logger     : ILogger;
  ucConsumer : IUnicastConsumer;
}
