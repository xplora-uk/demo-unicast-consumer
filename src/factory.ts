import axios from 'axios';
import express, { Request, Response } from 'express';
import { newUnicastConsumer } from './unicast-consumers';
import { IUnicastConsumeInput } from './types';

export async function factory(penv = process.env) {
  const app = express();

  const queue = String(penv.UCC_QUEUE || 'queue');

  const queueHostBaseUrl = String(penv.UCC_TARGET_BASE_URL || 'http://queue_host.local');

  const config = {
    http: {
      port: Number.parseInt(penv.UCC_HTTP_PORT || '3000'),
    },
    messageConsumer: {
      kind: penv.UCC_KIND || 'rabbitmq',
      queue,
      queueHostBaseUrl,
      conf: {
        url: penv.UCC_URL || 'amqp://localhost:5672',
      },
    },
  };

  const ucConsumer = await newUnicastConsumer(config.messageConsumer);

  const httpClient = axios.create({
    baseURL: queueHostBaseUrl,
    validateStatus: (status) => status === 200,
  });

  // convention: POST /queue-name body -> payload
  const callPath = `/${queue}`;

  console.info('unicast-consumer will POST to', queueHostBaseUrl + callPath);

  const output = await ucConsumer.startUnicastConsuming({
    queue,
    unicastConsume: async (input: IUnicastConsumeInput) => {
      // act like a reverse proxy
      try {
        const payloadObj = JSON.parse(input.payload);
        console.debug('unicast-consumer received', payloadObj);
        const response = await httpClient.post(callPath, payloadObj);
        console.info('target responded', response.status, response.data);
        return { success: true, error: '' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Target failed' };
      }
    },
  });

  console.info('unicast-consumer started', output);

  async function healthCheck(_req: Request, res: Response) {
    // TODO: check connection to message broker
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  return { app, config, ucConsumer, healthCheck };
}
