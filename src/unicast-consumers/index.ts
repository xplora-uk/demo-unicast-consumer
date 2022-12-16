import { IUnicastConsumer, IUnicastConsumerSettings } from '../types';
import { newRabbitMqUnicastConsumer } from './rabbitmq';

export function newUnicastConsumer(settings: IUnicastConsumerSettings): Promise<IUnicastConsumer> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqUnicastConsumer(settings.conf);
  }

  throw new Error('Unknown unicast message consumer kind');
}
