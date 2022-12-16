import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { Channel, ConsumeMessage } from 'amqplib';
import { IUnicastConsumeOutput, IUnicastConsumer, IUnicastConsumerConf, IStartUnicastConsumingInput, IStartUnicastConsumingOutput } from '../types';

const connectionOptions = {
  timeout: 5000,
  heartbeatIntervalInSeconds: 15, // default is 5
  reconnectTimeInSeconds: 15, // defaults to heartbeatIntervalInSeconds
};

const channelOptions = {
  publishTimeout: 10000,
};

// When RabbitMQ quits or crashes it will forget the queues and messages 
// unless you tell it not to. Two things are required to make sure that messages aren't lost:
// we need to mark both the queue and messages as durable.
// both publisher and consumer MUST have the same setting
const queueOptions = { durable: true };

// prefetch: 1 => Don't dispatch a new message to a worker until it has processed and acknowledged the previous one.
// Instead, dispatch it to the next worker that is not still busy
// noAck: false => manual acknowledgement is needed
const consumeOptions = { prefetch: 1, noAck: false };

function makeConsumeWrapper(channel: ChannelWrapper, input: IStartUnicastConsumingInput) {

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
    }
  }

  return consumeWrapper;
}

class RabbitMqUnicastConsumer implements IUnicastConsumer {

  protected _channels: Record<string, ChannelWrapper> = {};

  constructor(protected _connection: IAmqpConnectionManager) {
    // nothing to do
  }

  _channelCache(name: string): ChannelWrapper {
    // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
    //if (!this._connection.isConnected) { // NOT connected
    //  this._connection.reconnect();
    //}
    if (!(name in this._channels) || !this._channels[name]) {
      this._channels[name] = this._connection.createChannel({ ...channelOptions, name });
    }
    return this._channels[name];
  }

  async startUnicastConsuming(input: IStartUnicastConsumingInput): Promise<IStartUnicastConsumingOutput> {
    const func = 'RabbitMqUnicastConsumer.startUnicastConsuming';
    let success = false, error = '';

    try {
      const channelWrapper = this._channelCache(input.queue);
      await channelWrapper.assertQueue(input.queue, queueOptions);
      const consumeWrapper = makeConsumeWrapper(channelWrapper, input);
      await channelWrapper.consume(input.queue, consumeWrapper, consumeOptions);
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

export function newRabbitMqUnicastConsumer(settings: IUnicastConsumerConf): Promise<IUnicastConsumer> {

  

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
