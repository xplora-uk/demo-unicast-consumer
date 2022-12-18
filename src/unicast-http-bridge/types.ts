import { AxiosInstance } from 'axios';
import { ILogger } from '../loggers/types';

export interface IUnicastHttpBridgeSettings {
  httpClient      : AxiosInstance;
  logger          : ILogger;
  queue           : string;
  queueHostBaseUrl: string;
}
