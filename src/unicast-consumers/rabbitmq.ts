import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { ConsumeMessage } from 'amqplib';
import { IConsumeMessageOutput, IUnicastConsumer, IUnicastConsumerConf, IStartUnicastConsumingInput, IStartUnicastConsumingOutput } from '../types';

export function newRabbitMqUnicastConsumer(settings: IUnicastConsumerConf): Promise<IUnicastConsumer> {

  class RabbitMqUnicastConsumer implements IUnicastConsumer {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async startUnicastConsuming(input: IStartUnicastConsumingInput): Promise<IStartUnicastConsumingOutput> {
      const func = 'RabbitMqUnicastConsumer.startUnicastConsuming';
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
          const funcLambda = 'RabbitMqUnicastConsumer.startUnicastConsuming.lambda-consume';
          try {
            const payload = message.content.toString('utf-8');
            let output: IConsumeMessageOutput | null = null;
            try {
              output = await input.unicastConsume({ payload });
            } catch (err) {
              output = {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
              };
            }
            console.info(funcLambda, { queue: input.queue, message, output });
            if (output && output.success) {
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

    async close(): Promise<void> {
      if (this._connection) {
        try {
          await this._connection.close();
        } catch (err) {
          console.error('RabbitMqUnicastConsumer.close error', err);
        }
      }
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

  return Promise.resolve(new RabbitMqUnicastConsumer(connection));
}
