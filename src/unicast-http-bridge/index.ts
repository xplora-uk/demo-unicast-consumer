import { IStartUnicastConsumingInput, IUnicastConsumeInput } from '../unicast-consumers/types';
import { IUnicastHttpBridgeSettings } from './types';

export function newUnicastHttpBridge(settings: IUnicastHttpBridgeSettings): IStartUnicastConsumingInput {
  const { queue, queueHostBaseUrl, logger, httpClient } = settings;
  // convention: POST /queue-name body -> payload
  const callPath = `/${queue}`;
  logger.info('will POST from ' + queue + ' to ' + queueHostBaseUrl + callPath);

  async function unicastConsume(input: IUnicastConsumeInput) {
    // act like a reverse proxy
    try {
      logger.debug('UnicastHttpBridge.unicastConsume received', input.payload);
      const payloadObj = JSON.parse(input.payload);
      const response = await httpClient.post(callPath, payloadObj);
      logger.info('UnicastHttpBridge.unicastConsume target responded', [response.status, response.data]);
      return { success: true, error: '' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Target failed' };
    }
  }

  return { queue, unicastConsume };
}
