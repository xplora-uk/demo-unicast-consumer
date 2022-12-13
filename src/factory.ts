import express from 'express';
import { newMessageConsumer } from './message-consumers';
import { IConsumeMessageInput } from './types';

export async function factory(penv = process.env) {
  const app = express();

  const msgConsumer = await newMessageConsumer({
    kind: penv.MC_KIND || 'rabbitmq',
    conf: {
      hostname : penv.MC_HOSTNAME || 'localhost',
      port     : Number.parseInt(penv.MC_PORT || '0'),
      username : penv.MC_USERNAME || '',
      password : penv.MC_PASSWORD || '',
      heartbeat: 30,
    },
  });

  const queue  = String(penv.MC_QUEUE || '');
  const output = await msgConsumer.startConsuming({
    queue,
    consume: async (input: IConsumeMessageInput) => {
      console.log(input.payload);
      return { success: true, error: '' };
    },
  });

  console.info('message-consumer ready', output);

  app.get('/health', async (_req, res) => {
    res.json({ status: 'OK', ts: new Date() });
  });

  return { app, msgConsumer };
}
