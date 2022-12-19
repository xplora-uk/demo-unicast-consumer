import { ILoggerSettings } from '../loggers/types';
import { IUnicastConsumerSettings } from '../unicast-consumers/types';

export interface IConfig {
  app: {
    id: string;
  };
  http: {
    port: number;
  };
  logger: ILoggerSettings;
  messageConsumer: IUnicastConsumerSettings;
}
