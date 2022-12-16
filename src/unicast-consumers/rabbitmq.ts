import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { Channel, ConsumeMessage } from 'amqplib';
import { IUnicastConsumeOutput, IUnicastConsumer, IUnicastConsumerConf, IStartUnicastConsumingInput, IStartUnicastConsumingOutput } from '../types';

export function newRabbitMqUnicastConsumer(settings: IUnicastConsumerConf): Promise<IUnicastConsumer> {

  // When RabbitMQ quits or crashes it will forget the queues and messages 
  // unless you tell it not to. Two things are required to make sure that messages aren't lost:
  // we need to mark both the queue and messages as durable.
  // both publisher and consumer MUST have the same setting
  const queueOptions = { durable: true };

  // prefetch: 1 => Don't dispatch a new message to a worker until it has processed and acknowledged the previous one.
  // Instead, dispatch it to the next worker that is not still busy
  // noAck: false => manual acknowledgement is needed
  const consumeOptions = { prefetch: 1, noAck: false };

  function makeConsumeWrapper(channel: Channel, input: IStartUnicastConsumingInput) {

    async function consumeWrapper(message: ConsumeMessage | null) {
      const funcLambda = 'consumeWrapper';
      try {
        if (!message) {
          console.info(funcLambda, 'no message');
          return;
        }

        const payload = message.content.toString('utf-8') || '';
        let output: IUnicastConsumeOutput | null = null;
        try {
          output = await input.unicastConsume({ payload });
          if (!output.success || output.error) {
            throw new Error(output.error ?? 'unicast message consumer failed');
          }
        } catch (err) {
          output = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
        console.info(funcLambda, { queue: input.queue, message, output });
        if (output && output.success) {
          channel.ack(message); // acknowledge; done
        } else {
          channel.nack(message); // do not acknowledge; failed
        }
      } catch (err) {
        console.error(funcLambda, err);
        throw err;
      }
    }

    return consumeWrapper;
  }

  class RabbitMqUnicastConsumer implements IUnicastConsumer {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async startUnicastConsuming(input: IStartUnicastConsumingInput): Promise<IStartUnicastConsumingOutput> {
      const func = 'RabbitMqUnicastConsumer.startUnicastConsuming';
      let success = false, error = '';

      try {
        // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
        // ask the connection manager for a ChannelWrapper
        connection.createChannel({
          setup: async (channel: Channel) => {
            await channel.assertQueue(input.queue, queueOptions);
            const consumeWrapper = makeConsumeWrapper(channel, input);
            await channel.consume(input.queue, consumeWrapper, consumeOptions);          
          },
        });
        // TODO: save channelWrapper?
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(func, err);
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
