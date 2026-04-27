/**
 * 数据表服务
 */
import { httpClient } from './HttpClient'
import { Result } from '../model/Result'
import type { Table, CreateTableReq } from '../model/types'

export class TableService {
  static getInstance(): TableService {
    if (!TableService.instance) TableService.instance = new TableService()
    return TableService.instance
  }
  private static instance: TableService

  /** 获取数据表 */
  async get(id: number): Promise<Result<Table>> {
    return httpClient.get<Table>(`/tables/${id}`)
  }

  /** 创建数据表 */
  async create(appId: number, req: CreateTableReq): Promise<Result<Table>> {
    return httpClient.post<Table>(`/apps/${appId}/tables`, req)
  }

  /** 更新数据表 */
  async update(id: number, req: Partial<CreateTableReq>): Promise<Result<Table>> {
    return httpClient.put<Table>(`/tables/${id}`, req)
  }

  /** 删除数据表 */
  async delete(id: number): Promise<Result<void>> {
    return httpClient.delete<void>(`/tables/${id}`)
  }
}

export const tableService = TableService.getInstance()
