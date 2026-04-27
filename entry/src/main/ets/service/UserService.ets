/**
 * 用户管理服务
 */
import { httpClient } from './HttpClient'
import { Result } from '../model/Result'
import type { UserInfo } from '../model/types'

export class UserService {
  static getInstance(): UserService {
    if (!UserService.instance) UserService.instance = new UserService()
    return UserService.instance
  }
  private static instance: UserService

  async list(params?: { page?: number; search?: string }): Promise<Result<{ users: UserInfo[]; total: number; page: number; pages: number }>> {
    return httpClient.get('/users', params as Record<string, string | number>)
  }

  async delete(id: number): Promise<Result<void>> {
    return httpClient.delete<void>(`/users/${id}`)
  }

  async grantAdmin(id: number): Promise<Result<void>> {
    return httpClient.post<void>('/users/batch', { action: 'grant_admin', user_id: id })
  }

  async revokeAdmin(id: number): Promise<Result<void>> {
    return httpClient.post<void>('/users/batch', { action: 'revoke_admin', user_id: id })
  }
}

export const userService = UserService.getInstance()
