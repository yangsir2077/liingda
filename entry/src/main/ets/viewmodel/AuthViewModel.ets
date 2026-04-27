/**
 * 认证 ViewModel
 * 管理登录/注册/忘记密码的业务逻辑和状态
 */
import { authService } from '../service/AuthService'
import { storageService } from '../service/StorageService'
import { Logger } from '../util/logger'
import { Validator } from '../util/validator'
import router from '@ohos.router'
import promptAction from '@ohos.promptAction'

export type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset'

export class AuthViewModel {
  // 表单状态
  mode: AuthMode = 'login'
  email: string = ''
  password: string = ''
  confirmPassword: string = ''
  name: string = ''
  verifyCode: string = ''
  newPassword: string = ''

  // UI 状态
  loading: boolean = false
  verifyEmail: string = ''

  // 输入校验
  get isLoginValid(): boolean {
    return Validator.email(this.email) && Validator.password(this.password)
  }

  get isRegisterValid(): boolean {
    return Validator.email(this.email) && Validator.password(this.password) && this.password === this.confirmPassword
  }

  get isVerifyValid(): boolean {
    return this.verifyCode.length === 6
  }

  get isForgotValid(): boolean {
    return Validator.email(this.email)
  }

  get isResetValid(): boolean {
    return Validator.password(this.newPassword) && this.newPassword === this.confirmPassword && this.verifyCode.length === 6
  }

  /** 切换模式 */
  switchMode(m: AuthMode): void {
    this.mode = m
    this.clearFields()
  }

  /** 登录 */
  async login(): Promise<boolean> {
    if (!this.isLoginValid) {
      promptAction.showToast({ message: '请填写正确的邮箱和密码' })
      return false
    }

    this.loading = true
    try {
      const result = await authService.login({ email: this.email, password: this.password })

      if (result.isSuccess) {
        promptAction.showToast({ message: '登录成功' })
        router.replaceUrl({ url: 'pages/DashboardPage' })
        return true
      }

      promptAction.showToast({ message: result.message })
      return false
    } catch (e) {
      Logger.error('login failed', e)
      promptAction.showToast({ message: '网络错误，请重试' })
      return false
    } finally {
      this.loading = false
    }
  }

  /** 注册 */
  async register(): Promise<boolean> {
    if (!this.isRegisterValid) {
      promptAction.showToast({ message: '请填写完整信息，密码至少6位' })
      return false
    }

    this.loading = true
    try {
      const result = await authService.register({
        email: this.email,
        password: this.password,
        name: this.name || undefined
      })

      if (result.isSuccess) {
        if (result.data?.need_verify) {
          this.verifyEmail = this.email
          this.mode = 'verify'
          promptAction.showToast({ message: '验证码已发送到邮箱' })
        } else if (result.data?.token) {
          promptAction.showToast({ message: '注册成功' })
          router.replaceUrl({ url: 'pages/DashboardPage' })
        }
        return true
      }

      promptAction.showToast({ message: result.message })
      return false
    } catch (e) {
      Logger.error('register failed', e)
      promptAction.showToast({ message: '网络错误，请重试' })
      return false
    } finally {
      this.loading = false
    }
  }

  /** 验证邮箱 */
  async verifyEmailCode(): Promise<boolean> {
    if (!this.isVerifyValid) {
      promptAction.showToast({ message: '请输入6位验证码' })
      return false
    }

    this.loading = true
    try {
      const result = await authService.verifyEmail({
        email: this.verifyEmail,
        code: this.verifyCode
      })

      if (result.isSuccess) {
        promptAction.showToast({ message: '验证成功' })
        router.replaceUrl({ url: 'pages/DashboardPage' })
        return true
      }

      promptAction.showToast({ message: result.message })
      return false
    } catch (e) {
      Logger.error('verify failed', e)
      promptAction.showToast({ message: '网络错误，请重试' })
      return false
    } finally {
      this.loading = false
    }
  }

  /** 发送重置密码验证码 */
  async sendResetCode(): Promise<boolean> {
    if (!this.isForgotValid) {
      promptAction.showToast({ message: '请输入正确的邮箱' })
      return false
    }

    this.loading = true
    try {
      const result = await authService.sendResetCode({ email: this.email })

      if (result.isSuccess) {
        this.verifyEmail = this.email
        this.mode = 'reset'
        promptAction.showToast({ message: '验证码已发送到邮箱' })
        return true
      }

      promptAction.showToast({ message: result.message })
      return false
    } catch (e) {
      Logger.error('sendResetCode failed', e)
      promptAction.showToast({ message: '网络错误，请重试' })
      return false
    } finally {
      this.loading = false
    }
  }

  /** 重置密码 */
  async resetPassword(): Promise<boolean> {
    if (!this.isResetValid) {
      promptAction.showToast({ message: '请填写完整信息' })
      return false
    }

    this.loading = true
    try {
      const result = await authService.resetPassword({
        email: this.verifyEmail,
        code: this.verifyCode,
        password: this.newPassword
      })

      if (result.isSuccess) {
        promptAction.showToast({ message: '密码重置成功，请登录' })
        this.mode = 'login'
        this.password = this.newPassword
        return true
      }

      promptAction.showToast({ message: result.message })
      return false
    } catch (e) {
      Logger.error('resetPassword failed', e)
      promptAction.showToast({ message: '网络错误，请重试' })
      return false
    } finally {
      this.loading = false
    }
  }

  /** 退出登录 */
  logout(): void {
    authService.logout()
    router.replaceUrl({ url: 'pages/LoginPage' })
  }

  /** 检查是否已登录（启动页用） */
  checkAuth(): boolean {
    return storageService.isLoggedIn()
  }

  /** 清空表单 */
  private clearFields(): void {
    this.password = ''
    this.confirmPassword = ''
    this.name = ''
    this.verifyCode = ''
    this.newPassword = ''
  }
}
