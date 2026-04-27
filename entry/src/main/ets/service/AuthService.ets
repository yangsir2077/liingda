/**
 * 认证服务
 * 处理登录、注册、验证码、Token 管理
 */
import { httpClient } from './HttpClient'
import { storageService } from './StorageService'
import { Result } from '../model/Result'
import type {
  AuthResponse,
  LoginReq,
  RegisterReq,
  VerifyEmailReq,
  SendResetCodeReq,
  ResetPasswordReq,
  UserInfo
} from '../model/types'

// 注册请求拦截器：自动附加 Token
httpClient.setRequestInterceptor((config) => {
  const token = storageService.getToken()
  if (token) {
    const headers = config.header || {}
    config.header = { ...headers, 'Authorization': `Bearer ${token}` }
  }
  return config
})

export class AuthService {
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private static instance: AuthService

  /** 登录 */
  async login(req: LoginReq): Promise<Result<AuthResponse>> {
    const result = await httpClient.post<AuthResponse>('/auth/login', req)
    if (result.isSuccess && result.data?.token) {
      storageService.saveToken(result.data.token)
    }
    return result
  }

  /** 注册 */
  async register(req: RegisterReq): Promise<Result<AuthResponse>> {
    return httpClient.post<AuthResponse>('/auth/register', req)
  }

  /** 验证邮箱验证码 */
  async verifyEmail(req: VerifyEmailReq): Promise<Result<AuthResponse>> {
    const result = await httpClient.post<AuthResponse>('/auth/verify-email', req)
    if (result.isSuccess && result.data?.token) {
      storageService.saveToken(result.data.token)
    }
    return result
  }

  /** 发送重置密码验证码 */
  async sendResetCode(req: SendResetCodeReq): Promise<Result<void>> {
    return httpClient.post<void>('/auth/send-reset-code', req)
  }

  /** 重置密码 */
  async resetPassword(req: ResetPasswordReq): Promise<Result<AuthResponse>> {
    const result = await httpClient.post<AuthResponse>('/auth/reset-password', req)
    if (result.isSuccess && result.data?.token) {
      storageService.saveToken(result.data.token)
    }
    return result
  }

  /** 验证 Token 有效性，获取当前用户 */
  async getCurrentUser(): Promise<Result<UserInfo>> {
    return httpClient.get<UserInfo>('/auth/me')
  }

  /** 退出登录 */
  logout(): void {
    storageService.clearToken()
  }
}

export const authService = AuthService.getInstance()
