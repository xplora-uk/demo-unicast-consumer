import { IMessageConsumer, IMessageConsumerSettings } from '../types';
import { newRabbitMqMessageConsumer } from './rabbitmq';

export function newMessageConsumer(settings: IMessageConsumerSettings): Promise<IMessageConsumer> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqMessageConsumer(settings.conf);
  }

  throw new Error('Unknown message consumer kind');
}
