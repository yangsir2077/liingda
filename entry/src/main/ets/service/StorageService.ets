/**
 * 本地存储服务
 * 管理 Token 和用户信息的持久化
 */
import promptAction from '@ohos.promptAction'

const TOKEN_KEY = 'lingda_token'
const USER_KEY = 'lingda_user'

export class StorageService {
  private static instance: StorageService

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  /**
   * 保存 Token
   */
  saveToken(token: string): void {
    AppStorage.setOrCreate(TOKEN_KEY, token)
  }

  /**
   * 读取 Token
   */
  getToken(): string {
    return AppStorage.get(TOKEN_KEY) as string || ''
  }

  /**
   * 删除 Token（退出登录）
   */
  clearToken(): void {
    AppStorage.delete(TOKEN_KEY)
    AppStorage.delete(USER_KEY)
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return !!this.getToken()
  }
}

export const storageService = StorageService.getInstance()
