/**
 * 应用服务
 */
import { httpClient } from './HttpClient'
import { Result } from '../model/Result'
import type { App, CreateAppReq, AppStats } from '../model/types'

export class AppService {
  static getInstance(): AppService {
    if (!AppService.instance) AppService.instance = new AppService()
    return AppService.instance
  }
  private static instance: AppService

  /** 获取应用列表 */
  async list(): Promise<Result<App[]>> {
    return httpClient.get<App[]>('/apps')
  }

  /** 获取单个应用 */
  async get(id: number): Promise<Result<App>> {
    return httpClient.get<App>(`/apps/${id}`)
  }

  /** 创建应用 */
  async create(req: CreateAppReq): Promise<Result<App>> {
    return httpClient.post<App>('/apps', req)
  }

  /** 更新应用 */
  async update(id: number, req: Partial<CreateAppReq>): Promise<Result<App>> {
    return httpClient.put<App>(`/apps/${id}`, req)
  }

  /** 删除应用 */
  async delete(id: number): Promise<Result<void>> {
    return httpClient.delete<void>(`/apps/${id}`)
  }

  /** 获取应用统计 */
  async stats(): Promise<Result<AppStats>> {
    return httpClient.get<AppStats>('/apps/stats')
  }
}

export const appService = AppService.getInstance()
