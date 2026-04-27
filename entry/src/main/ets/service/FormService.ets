/**
 * 公开表单服务
 */
import { httpClient } from './HttpClient'
import { Result } from '../model/Result'
import type { Form, CreateFormReq, FormSubmitReq } from '../model/types'

export class FormService {
  static getInstance(): FormService {
    if (!FormService.instance) FormService.instance = new FormService()
    return FormService.instance
  }
  private static instance: FormService

  /** 获取表单列表 */
  async list(tableId: number): Promise<Result<Form[]>> {
    return httpClient.get<Form[]>(`/tables/${tableId}/forms`)
  }

  /** 创建公开表单 */
  async create(tableId: number, req: CreateFormReq): Promise<Result<Form>> {
    return httpClient.post<Form>(`/tables/${tableId}/forms`, req)
  }

  /** 删除表单 */
  async delete(id: number): Promise<Result<void>> {
    return httpClient.delete<void>(`/forms/${id}`)
  }

  /** 提交公开表单 */
  async submit(publicKey: string, req: FormSubmitReq): Promise<Result<void>> {
    return httpClient.post<void>(`/public/forms/${publicKey}`, req)
  }
}

export const formService = FormService.getInstance()
