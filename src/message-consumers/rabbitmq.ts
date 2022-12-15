import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { ConsumeMessage } from 'amqplib';
import { IMessageConsumer, IMessageConsumerConf, IStartConsumingInput, IStartConsumingOutput } from '../types';

export function newRabbitMqMessageConsumer(settings: IMessageConsumerConf): Promise<IMessageConsumer> {

  class RabbitMqMessageConsumer implements IMessageConsumer {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async startConsuming(input: IStartConsumingInput): Promise<IStartConsumingOutput> {
      const func = 'RabbitMqMessageConsumer.startConsuming';
      let success = false, error = '';

      // TODO: optimize channel creation?
      // ask the connection manager for a ChannelWrapper
      const channelWrapper = connection.createChannel();

      // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
      // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
      try {
        // TODO: check queue options
        await channelWrapper.assertQueue(input.queue, { durable: false });

        // start consuming messages on queue
        await channelWrapper.consume(input.queue, async (message: ConsumeMessage) => {
          const funcLambda = 'RabbitMqMessageConsumer.startConsuming.lambda-consume';
          try {
            const payload = message.content.toString('utf-8');
            const output = await input.consume({ payload });
            console.info(funcLambda, { queue: input.queue, message, output });
            if (output.success) {
              await channelWrapper.ack(message); // acknowledge; done
            } else {
              await channelWrapper.nack(message); // do not acknowledge; failed
            }
          } catch (err) {
            console.error(funcLambda, err);
          }
        });
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(func, err);
      } finally {
        channelWrapper.close().catch(() => {}); // no op
      }

      return { success, error };
    }
  }

  const connection = amqp.connect(
    {
      ...settings,
      connectionOptions: {
        timeout: 5000,
      },
    },
  );

  return Promise.resolve(new RabbitMqMessageConsumer(connection));
}
