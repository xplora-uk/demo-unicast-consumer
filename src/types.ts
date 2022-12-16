export interface IUnicastConsumerSettings {
  kind : 'rabbitmq' | 'redis' | 'kafka' | string;
  conf : IUnicastConsumerConf;
  queue: string;
}

export interface IUnicastConsumerConf {
  // TODO: either find common config for different kinds or define separate types for each
  //url     : string;
  protocol?: string;         // amqp, amqps, 
  username : string;
  password : string;
  hostname : string;
  port     : number;
  vhost?   : string;
  locale?  : string;
  ca?      : Array<Buffer>;
  heartbeat: number;
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
