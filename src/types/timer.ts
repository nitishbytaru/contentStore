import { TimerMode as TimerModeEnum } from '@/enums';

export { TimerModeEnum };

export type TimerMode = `${TimerModeEnum}`;

export interface CountdownPreset {
  label: string;
  seconds: number;
}
