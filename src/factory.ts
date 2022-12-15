import express, { Request, Response } from 'express';
import { newMessageConsumer } from './message-consumers';
import { IConsumeMessageInput } from './types';

export async function factory(penv = process.env) {
  const app = express();

  app.use(express.text({ limit: '1MB' }));
  app.use(express.json({ limit: '1MB' }));

  const queue = String(penv.MC_QUEUE || 'queue');

  const config = {
    http: {
      port: Number.parseInt(penv.MB_HTTP_PORT || '3000'),
    },
    messageConsumer: {
      kind: penv.MC_KIND || 'rabbitmq',
      queue,
      conf: {
        hostname : penv.MC_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.MC_PORT || '0'),
        username : penv.MC_USERNAME || '',
        password : penv.MC_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const msgConsumer = await newMessageConsumer(config.messageConsumer);

  const output = await msgConsumer.startConsuming({
    queue,
    consume: async (input: IConsumeMessageInput) => {
      // TODO: do something useful
      console.debug('payload', input.payload);
      return { success: true, error: '' };
    },
  });

  console.info('message-consumer ready', output);

  async function healthCheck(_req: Request, res: Response) {
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  return { app, config, msgConsumer, healthCheck };
}
