import dotenv from 'dotenv';
import { factory } from './factory';

dotenv.config();
main();

async function main(penv = process.env) {

  const { app, config } = await factory(penv);

  app.listen(config.http.port, () => {
    console.info('unicast-consumer is listening to', config.messageConsumer.queue, 'at', config.http.port);
  });

}
