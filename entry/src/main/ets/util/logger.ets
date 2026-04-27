/**
 * 日志工具
 */
import { hiDebugLabel, hiSysEventParam } from '@kit.PerformanceAnalysisKit'

const TAG = '[零搭]'

export class Logger {
  static info(msg: string, ...args: any[]): void {
    console.info(`${TAG} ${msg}`, ...args)
  }

  static warn(msg: string, ...args: any[]): void {
    console.warn(`${TAG} ${msg}`, ...args)
  }

  static error(msg: string, ...args: any[]): void {
    console.error(`${TAG} ${msg}`, ...args)
  }
}
