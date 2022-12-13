import { factory } from './factory';

main();

async function main(penv = process.env) {

  const port = Number.parseInt(penv.MC_HTTP_PORT || '9000');

  const { app } = await factory(penv);

  app.listen(port, () => {
    console.info('message-consumer is listening at', port);
  });

}
