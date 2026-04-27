/**
 * HTTP 请求客户端
 * 基于 @ohos.net.http
 */

import http from '@ohos.net.http'
import { Result, ResultCode } from '../model/Result'

const BASE_URL = 'http://10.11.146.184:5000/api'
const TIMEOUT_MS = 15000

// 请求拦截器
type RequestInterceptor = (config: HttpConfig) => HttpConfig

// 响应拦截器
type ResponseInterceptor = (result: Result<any>) => Result<any>

export interface HttpConfig {
  url: string
  method: http.RequestMethod
  header?: Record<string, string>
  extraData?: string | Object
}

class HttpClient {
  private requestInterceptor: RequestInterceptor | null = null
  private responseInterceptor: ResponseInterceptor | null = null

  setRequestInterceptor(fn: RequestInterceptor): void {
    this.requestInterceptor = fn
  }

  setResponseInterceptor(fn: ResponseInterceptor): void {
    this.responseInterceptor = fn
  }

  async get<T>(url: string, params?: Record<string, string | number>, headers?: Record<string, string>): Promise<Result<T>> {
    let fullUrl = url
    if (params) {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      if (query) fullUrl += `?${query}`
    }
    return this.request<T>({ url: fullUrl, method: http.RequestMethod.GET, header: headers })
  }

  async post<T>(url: string, data?: Object, headers?: Record<string, string>): Promise<Result<T>> {
    return this.request<T>({
      url,
      method: http.RequestMethod.POST,
      header: { 'Content-Type': 'application/json', ...headers },
      extraData: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(url: string, data?: Object, headers?: Record<string, string>): Promise<Result<T>> {
    return this.request<T>({
      url,
      method: http.RequestMethod.PUT,
      header: { 'Content-Type': 'application/json', ...headers },
      extraData: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<Result<T>> {
    return this.request<T>({ url, method: http.RequestMethod.DELETE, header: headers })
  }

  private async request<T>(config: HttpConfig): Promise<Result<T>> {
    const finalConfig = this.requestInterceptor ? this.requestInterceptor(config) : config

    const client = http.createHttp()

    try {
      const resp = await client.request(
        `${BASE_URL}${config.url}`,
        {
          method: finalConfig.method,
          header: finalConfig.header || {},
          extraData: finalConfig.extraData as string,
          connectTimeout: TIMEOUT_MS,
          readTimeout: TIMEOUT_MS
        }
      )

      const result = this.parse<T>(resp.responseCode, resp.result as string | Object)
      return this.responseInterceptor ? this.responseInterceptor(result) : result
    } catch {
      return Result.networkError()
    } finally {
      client.destroy()
    }
  }

  private parse<T>(code: number, raw: string | Object): Result<T> {
    try {
      if (code === 204) return Result.ok(undefined as any)

      const data = typeof raw === 'string' ? JSON.parse(raw) : raw

      if (code >= 200 && code < 300) {
        return Result.ok(data as T)
      }

      if (code === 401) return Result.unauthorized()

      return Result.err(code, (data as any)?.error || `请求失败 (${code})`)
    } catch {
      return code >= 200 && code < 300 ? Result.ok(raw as T) : Result.err(code, String(raw))
    }
  }
}

export const httpClient = new HttpClient()
