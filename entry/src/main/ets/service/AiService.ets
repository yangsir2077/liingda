/**
 * AI 服务 - 对接本地 DeepSeek (Ollama)
 * 用于智能字段建议、应用描述生成、数据分析等
 */
import http from '@ohos.net.http'
import { Logger } from '../util/logger'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'deepseek-coder:1.3b'
const TIMEOUT = 60000

export interface AiSuggestion {
  field: string
  reason: string
  confidence: number  // 0-1
}

export interface DataSummary {
  total: number
  insight: string
  trends: string[]
  alerts: string[]
}

class AiService {
  private static instance: AiService

  static getInstance(): AiService {
    if (!AiService.instance) AiService.instance = new AiService()
    return AiService.instance
  }

  /**
   * 发送对话请求
   */
  async ask(prompt: string, timeout: number = TIMEOUT): Promise<Result<string>> {
    const client = http.createHttp()

    try {
      const resp = await client.request(
        OLLAMA_URL,
        {
          method: http.RequestMethod.POST,
          header: { 'Content-Type': 'application/json' },
          extraData: JSON.stringify({ model: MODEL, prompt, stream: false }),
          connectTimeout: timeout,
          readTimeout: timeout
        }
      )

      if (resp.responseCode === 200) {
        const data = JSON.parse(resp.result as string)
        return { ok: true, data: data.response }
      }

      return { ok: false, error: `AI 服务错误 (${resp.responseCode})` }
    } catch (e) {
      return { ok: false, error: 'AI 服务不可用，请确保 Ollama 运行中' }
    } finally {
      client.destroy()
    }
  }

  /**
   * AI 生成应用描述
   */
  async generateAppDescription(name: string, fields: string[]): Promise<string> {
    const prompt = `为一个名为"${name}"的管理系统生成一句简短描述（不超过30字），系统包含以下字段：${fields.join('、')}。只返回描述文字，不要其他内容。`
    const result = await this.ask(prompt, 30000)
    return result.ok ? result.data!.trim() : ''
  }

  /**
   * AI 推荐字段类型
   */
  async suggestFields(appName: string, userDescription: string): Promise<AiSuggestion[]> {
    const prompt = `根据应用"${appName}"的用途${userDescription ? `（用户描述：${userDescription}）` : ''}，推荐5个最常用的字段。
返回格式（JSON数组）：
[
  {"field": "字段名", "type": "text|number|select|date", "reason": "推荐理由", "confidence": 0.0-1.0}
]
只返回JSON，不要其他内容。`

    const result = await this.ask(prompt, 30000)
    if (!result.ok) return []

    try {
      // 提取 JSON
      const jsonMatch = result.data!.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      Logger.warn('Failed to parse AI field suggestions', e)
    }
    return []
  }

  /**
   * AI 分析数据趋势
   */
  async analyzeRecords(tableName: string, fields: string[], records: Record<string, any>[]): Promise<DataSummary> {
    if (records.length === 0) {
      return { total: 0, insight: '暂无数据', trends: [], alerts: [] }
    }

    const sample = records.slice(0, 5)
    const prompt = `分析"${tableName}"表的数据（共${records.length}条记录）。
字段：${fields.join('、')}
样例数据：${JSON.stringify(sample, null, 2)}

请用中文分析：
1. 数据整体洞察（50字内）
2. 可能的趋势（2-3条）
3. 异常/需要关注的点（1-2条）

返回格式（JSON）：
{"insight":"...","trends":["...","..."],"alerts":["..."]}
只返回JSON。`

    const result = await this.ask(prompt, 45000)
    if (!result.ok) {
      return { total: records.length, insight: '', trends: [], alerts: [] }
    }

    try {
      const jsonMatch = result.data!.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      Logger.warn('Failed to parse AI analysis', e)
    }

    return { total: records.length, insight: '', trends: [], alerts: [] }
  }

  /**
   * AI 生成表单提交成功文案
   */
  async generateSuccessMessage(formName: string): Promise<string> {
    const messages = [
      `感谢您的填写，「${formName}」已成功提交！`,
      `「${formName}」提交成功，我们会尽快处理。`,
      `您的「${formName}」已收到，感谢配合！`,
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

interface Result<T> {
  ok: boolean
  data?: T
  error?: string
}

export const aiService = AiService.getInstance()
