import axios from 'axios';
import express, { Request, Response } from 'express';
import { makeLogger } from './loggers';
import { makeUnicastHttpBridge } from './unicast-http-bridge';
import { newUnicastConsumer } from './unicast-consumers';

export async function factory(penv = process.env) {
  const app = express();

  const appId = String(penv.UCC_APP_ID || 'unicast-consumer');

  const httpPort = Number.parseInt(penv.UCC_HTTP_PORT || '3000');

  const queue = String(penv.UCC_BROKER_QUEUE || 'queue');
  const queueHostBaseUrl = String(penv.UCC_TARGET_BASE_URL || 'http://localhost');

  const config = {
    app: {
      id: appId,
    },
    http: {
      port: Number.isNaN(httpPort) || httpPort <= 0 ? 3000 : httpPort,
    },
    logger: {
      kind: penv.UCC_LOGGER_KIND || 'console',
      appId,
    },
    messageConsumer: {
      kind: penv.UCC_BROKER_KIND || 'rabbitmq',
      queue,
      queueHostBaseUrl,
      conf: {
        url: penv.UCC_BROKER_URL || 'amqp://localhost:5672',
      },
    },
  };

  const logger = makeLogger(config.logger);

  const ucConsumer = await newUnicastConsumer(config.messageConsumer, logger);

  const httpClient = axios.create({
    baseURL: queueHostBaseUrl,
    validateStatus: (status) => status === 200,
  });

  const queues = ['queue1', 'queue2', 'queue3'];
  for (let q of queues) {
    const output = await ucConsumer.startUnicastConsuming(
      makeUnicastHttpBridge({
        httpClient,
        logger,
        queue: q,
        queueHostBaseUrl,
      }),
    );
    logger.info('started', { q, output });
  }

  async function healthCheck(_req: Request, res: Response) {
    // TODO: check connection to message broker
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  return { app, config, healthCheck, logger, ucConsumer };
}
