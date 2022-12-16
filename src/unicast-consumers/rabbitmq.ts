import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { ConsumeMessage } from 'amqplib';
import { IConsumeMessageOutput, IUnicastConsumer, IUnicastConsumerConf, IStartUnicastConsumingInput, IStartUnicastConsumingOutput } from '../types';

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
        // our queues are durable 
        await channelWrapper.assertQueue(input.queue, queueOptions);

        async function consumeWrapper(message: ConsumeMessage) {
          const funcLambda = func + '.consumeWrapper';
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
              channelWrapper.ack(message); // acknowledge; done
            } else {
              channelWrapper.nack(message); // do not acknowledge; failed
            }
          } catch (err) {
            console.error(funcLambda, err);
          }
        }

        // start consuming messages on queue
        await channelWrapper.consume(input.queue, consumeWrapper, consumeOptions);
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
