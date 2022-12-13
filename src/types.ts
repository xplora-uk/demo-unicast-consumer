export interface IMessageConsumerSettings {
  kind: 'rabbitmq' | 'redis' | 'kafka' | string;
  conf: IMessageConsumerConf;
}

export interface IMessageConsumerConf {
  // TODO: either find common config for different kinds or define separate types for each
  //url     : string;
  protocol?: string; // amqp, amqps, 
  username : string;
  password : string;
  hostname : string;
  port     : number;
  vhost?   : string;
  locale?  : string;
  ca?      : Array<Buffer>;
  heartbeat: number;
}

export interface IMessageConsumer {
  startConsuming(input: IStartConsumingInput): Promise<IStartConsumingOutput>;
}

export interface IStartConsumingInput {
  queue: string;
  consume(input: IConsumeMessageInput): Promise<IConsumeMessageOutput>;
}

export interface IStartConsumingOutput {
  success: boolean;
  error  : string | null;
}

export interface IConsumeMessageInput {
  payload: string;
}

export interface IConsumeMessageOutput {
  success: boolean;
  error  : string | null;
}
