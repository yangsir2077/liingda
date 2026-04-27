/**
 * 验证工具
 */
export class Validator {
  /** 邮箱格式校验 */
  static email(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  /** 手机号校验 */
  static phone(value: string): boolean {
    return /^1[3-9]\d{9}$/.test(value)
  }

  /** 密码强度（至少6位） */
  static password(value: string): boolean {
    return value.length >= 6
  }

  /** 非空字符串 */
  static notEmpty(value: string): boolean {
    return value.trim().length > 0
  }
}
