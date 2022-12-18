import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { Channel, ConsumeMessage } from 'amqplib';
import { ILogger } from '../loggers/types';
import { IUnicastConsumeOutput, IUnicastConsumer, IUnicastConsumerConf, IStartUnicastConsumingInput, IStartUnicastConsumingOutput } from './types';

const connMgrOptions = {
  heartbeatIntervalInSeconds: 15,   // default is 5
  reconnectTimeInSeconds    : 15,   // defaults to heartbeatIntervalInSeconds
  connectionOptions         : {
    timeout: 5000,
  },
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

function makeConsumeWrapper(
  senderFunc: string,
  channel: ChannelWrapper,
  input: IStartUnicastConsumingInput,
  logger: ILogger,
) {

  async function consumeWrapper(message: ConsumeMessage | null) {
    const funcLambda = senderFunc + ' consumeWrapper';
    try {
      if (!message) {
        logger.info(funcLambda + ' no message');
        return;
      }

      // message.fields.exchange -> ''
      // message.fields.routingKey -> queue name
      const payload = message.content.toString('utf-8') || '';

      //logger.debug(funcLambda + ' START', { queue: input.queue, message });
      logger.info(funcLambda + ' START ' + input.queue, { payload });

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

      logger.info(funcLambda + ' END ' + input.queue, { payload, output });

      if (output && output.success) {
        const ackResult = channel.ack(message); // acknowledge; done
        logger.info(funcLambda + ' ACK! ' + input.queue, { ackResult });
      } else {
        const nackResult = channel.nack(message); // do not acknowledge; failed
        logger.info(funcLambda + ' NO ACK! ' + input.queue, { nackResult });
      }
    } catch (err) {
      logger.error(funcLambda, err);
    }
  }

  return consumeWrapper;
}

class RabbitMqUnicastConsumer implements IUnicastConsumer {

  protected _channels: Record<string, ChannelWrapper> = {};

  constructor(
    protected _connection: IAmqpConnectionManager,
    protected _logger: ILogger,
  ) {
    // nothing to do
  }

  protected _channelCache(name: string): ChannelWrapper {
    // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
    if (!(name in this._channels) || !this._channels[name]) {
      this._channels[name] = this._connection.createChannel({
        name,
        setup: async (ch: Channel) => {
          this._logger.debug('RabbitMqUnicastConsumer._channelCache.createChannel.setup assertQueue...', { name });
          const res = await ch.assertQueue(name, queueOptions);
          this._logger.debug('RabbitMqUnicastConsumer._channelCache.createChannel.setup assertQueue... done!', { name, res });
          return res;
        },
      });
    }
    return this._channels[name];
  }

  async startUnicastConsuming(input: IStartUnicastConsumingInput): Promise<IStartUnicastConsumingOutput> {
    const func = 'RabbitMqUnicastConsumer.startUnicastConsuming';
    let success = false, error = '';

    try {
      this._logger.info(func + ' START');
      const channelWrapper = this._channelCache(input.queue);
      const consumeWrapper = makeConsumeWrapper(func, channelWrapper, input, this._logger);
      await channelWrapper.consume(input.queue, consumeWrapper, consumeOptions);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      this._logger.error(func, { err });
    }

    this._logger.info(func + ' END', { success, error });

    return { success, error };
  }

  async close(): Promise<void> {
    if (this._connection) {
      try {
        await this._connection.close();
      } catch (err) {
        this._logger.error('RabbitMqUnicastConsumer.close error', { err });
      }
    }
  }
}

export function newRabbitMqUnicastConsumer(
  settings: IUnicastConsumerConf,
  logger: ILogger,
): Promise<IUnicastConsumer> {
  const connection = amqp.connect(settings, connMgrOptions);
  return Promise.resolve(new RabbitMqUnicastConsumer(connection, logger));
}
