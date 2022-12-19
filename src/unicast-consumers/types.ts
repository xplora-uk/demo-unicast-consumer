export interface IUnicastConsumerSettings {
  kind: 'rabbitmq' | 'redis' | 'kafka' | string;
  conf: IUnicastConsumerConf;

  queues: Array<string>;
  queueHostBaseUrl: string;
}

export interface IUnicastConsumerConf {
  // TODO: either find common config for different kinds or define separate types for each
  url: string;
  ca?: Array<Buffer>;
}

export interface IUnicastConsumer {
  startUnicastConsuming(input: IStartUnicastConsumingInput): Promise<IStartUnicastConsumingOutput>;
}

export interface IStartUnicastConsumingInput {
  queue: string;
  unicastConsume(input: IUnicastConsumeInput): Promise<IUnicastConsumeOutput>;
}

export interface IStartUnicastConsumingOutput {
  success: boolean;
  error  : string | null;
}

export interface IUnicastConsumeInput {
  payload: string;
}

export interface IUnicastConsumeOutput {
  success: boolean;
  error  : string | null;
}
