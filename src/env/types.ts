type ProcessEnvType = typeof process.env;

export interface IEnvSettings extends ProcessEnvType {
  UCC_APP_ID?: string; // e.g. 'unicast-consumer'

  UCC_HTTP_PORT?: string; // e.g. '8001'

  // supports 'console', 'pino'
  UCC_LOGGER_KIND?: string;

  // supports 'rabbitmq'
  UCC_BROKER_KIND?: string;

  // separated by ';'
  UCC_BROKER_QUEUES?: string; // e.g. 'xplora.test_queue;xplora.test_queue2;xplora.test_queue3'

  UCC_BROKER_URL?: string; // 'amqp://admin:Str0ng,Pa55worD@localhost:5672'

  UCC_TARGET_BASE_URL?: string; // 'http://test_queue_host.local:8081'
}
