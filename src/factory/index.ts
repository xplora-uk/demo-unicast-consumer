
import express, { Request, Response } from 'express';
import { newLogger } from '../loggers';
import { newUnicastHttpBridge } from '../unicast-http-bridge';
import { newUnicastConsumer } from '../unicast-consumers';
import { newHttpClient } from '../http-client';
import { newConfig } from '../config';
import { IFactory } from './types';

export async function factory(penv = process.env): Promise<IFactory> {
  const app = express();

  const config = newConfig(penv);

  const logger = newLogger(config.logger);

  const ucConsumer = await newUnicastConsumer(config.messageConsumer, logger);

  const httpClient = newHttpClient({ baseURL: config.messageConsumer.queueHostBaseUrl });

  for (let q of config.messageConsumer.queues) {
    const output = await ucConsumer.startUnicastConsuming(
      newUnicastHttpBridge({
        httpClient,
        logger,
        queue: q,
        queueHostBaseUrl: config.messageConsumer.queueHostBaseUrl,
      }),
    );
    logger.info('started', { q, output });
  }

  async function healthCheck(_req: Request, res: Response): Promise<void> {
    // TODO: check connection to message broker
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  return { app, config, healthCheck, logger, ucConsumer };
}
