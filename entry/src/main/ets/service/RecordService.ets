/**
 * 记录服务
 */
import { httpClient } from './HttpClient'
import { Result, PageResult } from '../model/Result'
import type { Record, CreateRecordReq, BatchReq, ImportResult } from '../model/types'

export interface RecordListParams {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export class RecordService {
  static getInstance(): RecordService {
    if (!RecordService.instance) RecordService.instance = new RecordService()
    return RecordService.instance
  }
  private static instance: RecordService

  /** 获取记录列表（分页） */
  async list(tableId: number, params?: RecordListParams): Promise<Result<PageResult<Record>>> {
    return httpClient.get<PageResult<Record>>(`/tables/${tableId}/records`, params as Record<string, string | number>)
  }

  /** 获取单条记录 */
  async get(id: number): Promise<Result<Record>> {
    return httpClient.get<Record>(`/records/${id}`)
  }

  /** 创建记录 */
  async create(tableId: number, req: CreateRecordReq): Promise<Result<Record>> {
    return httpClient.post<Record>(`/tables/${tableId}/records`, req)
  }

  /** 更新记录 */
  async update(id: number, req: CreateRecordReq): Promise<Result<Record>> {
    return httpClient.put<Record>(`/records/${id}`, req)
  }

  /** 删除记录 */
  async delete(id: number): Promise<Result<void>> {
    return httpClient.delete<void>(`/records/${id}`)
  }

  /** 批量操作 */
  async batch(tableId: number, req: BatchReq): Promise<Result<void>> {
    return httpClient.post<void>(`/tables/${tableId}/records/batch`, req)
  }

  /** CSV 导入 */
  async import(tableId: number, csvContent: string): Promise<Result<ImportResult>> {
    return httpClient.post<ImportResult>(`/tables/${tableId}/import`, { csv: csvContent })
  }

  /** CSV 导出 */
  async export(tableId: number): Promise<Result<string>> {
    return httpClient.get<string>(`/tables/${tableId}/export`)
  }
}

export const recordService = RecordService.getInstance()
