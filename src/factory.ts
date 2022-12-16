import express, { Request, Response } from 'express';
import { newUnicastConsumer } from './unicast-consumers';
import { IConsumeMessageInput } from './types';

export async function factory(penv = process.env) {
  const app = express();

  const queue = String(penv.UCC_QUEUE || 'queue');

  const config = {
    http: {
      port: Number.parseInt(penv.MB_HTTP_PORT || '3000'),
    },
    messageConsumer: {
      kind: penv.UCC_KIND || 'rabbitmq',
      queue,
      conf: {
        hostname : penv.UCC_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.UCC_PORT || '0'),
        username : penv.UCC_USERNAME || '',
        password : penv.UCC_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const ucConsumer = await newUnicastConsumer(config.messageConsumer);

  const output = await ucConsumer.startUnicastConsuming({
    queue,
    unicastConsume: async (input: IConsumeMessageInput) => {
      // TODO: do something useful
      console.debug('payload', input.payload);
      return { success: true, error: '' };
    },
  });

  console.info('unicast-consumer ready', output);

  async function healthCheck(_req: Request, res: Response) {
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  return { app, config, ucConsumer, healthCheck };
}
