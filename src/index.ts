import dotenv from 'dotenv';
import { newEnvSettings } from './env';
import { IEnvSettings } from './env/types';
import { factory } from './factory';

dotenv.config();
main();

async function main() {

  const penv: IEnvSettings = newEnvSettings();

  const { app, config, logger } = await factory(penv);

  app.listen(config.http.port, () => {
    logger.info(config.app.id + ' is listening at ' + config.http.port);
  });

}
