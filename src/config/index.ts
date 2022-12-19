export function newConfig(penv = process.env) {
  const appId = String(penv.UCC_APP_ID || 'unicast-consumer');

  const httpPort = Number.parseInt(penv.UCC_HTTP_PORT || '3000');

  const queues = String(penv.UCC_BROKER_QUEUES || 'queue').split(';');

  const queueHostBaseUrl = String(penv.UCC_TARGET_BASE_URL || 'http://localhost');

  return {
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
      queues,
      queueHostBaseUrl,
      conf: {
        url: penv.UCC_BROKER_URL || 'amqp://localhost:5672',
      },
    },
  };
}
