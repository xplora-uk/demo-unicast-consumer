import axios, { AxiosInstance } from 'axios';
import HttpAgent, { HttpsAgent } from 'agentkeepalive';
import { IAxiosClientSettings } from "./types";

const httpAgentOptions = {
  maxSockets       : 100,
  maxFreeSockets   : 10,
  timeout          : 60 * 1000, // active socket keepalive for 60 seconds
  freeSocketTimeout: 30 * 1000, // free socket keepalive for 30 seconds
};

// override if needed
const httpsAgentOptions = {
  ...httpAgentOptions,
};

export function newHttpClient(settings: IAxiosClientSettings): AxiosInstance {
  return axios.create({
    baseURL       : settings.baseURL,
    validateStatus: (status: number) => status === 200,
    httpAgent     : new HttpAgent(httpAgentOptions),
    httpsAgent    : new HttpsAgent(httpsAgentOptions),
  });
}
