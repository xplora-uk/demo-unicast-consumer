import { IEnvSettings } from './types';

export function newEnvSettings(): IEnvSettings {
  return { ...process.env }; // return a copy
}
