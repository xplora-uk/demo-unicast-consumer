import { IUnicastConsumer, IUnicastConsumerSettings } from './types';
import { newRabbitMqUnicastConsumer } from './rabbitmq';
import { ILogger } from '../loggers/types';

export function newUnicastConsumer(settings: IUnicastConsumerSettings, logger: ILogger): Promise<IUnicastConsumer> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqUnicastConsumer(settings.conf, logger);
  }

  throw new Error('Unknown unicast message consumer kind');
}
