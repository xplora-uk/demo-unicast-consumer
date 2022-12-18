import dotenv from 'dotenv';
import { factory } from './factory';

dotenv.config();
main();

async function main(penv = process.env) {

  const { app, config, logger } = await factory(penv);

  app.listen(config.http.port, () => {
    logger.info(config.app.id + ' is listening at ' + config.http.port);
  });

}
