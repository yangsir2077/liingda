/**
 * API 返回结果包装
 * 统一处理成功/失败状态，避免嵌套 try-catch
 */

export enum ResultCode {
  SUCCESS = 0,
  PARAMS_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  NETWORK_ERROR = -1,
}

export class Result<T> {
  code: number
  data?: T
  error?: string

  private constructor(code: number, data?: T, error?: string) {
    this.code = code
    this.data = data
    this.error = error
  }

  static ok<T>(data?: T): Result<T> {
    return new Result<T>(ResultCode.SUCCESS, data)
  }

  static err(code: number, error: string): Result<T> {
    return new Result<T>(code, undefined, error)
  }

  static networkError(): Result<any> {
    return new Result(ResultCode.NETWORK_ERROR, undefined, '网络连接失败，请检查网络')
  }

  static unauthorized(): Result<any> {
    return new Result(ResultCode.UNAUTHORIZED, undefined, '登录已过期，请重新登录')
  }

  get isSuccess(): boolean {
    return this.code === ResultCode.SUCCESS
  }

  get isUnauthorized(): boolean {
    return this.code === ResultCode.UNAUTHORIZED
  }

  get message(): string {
    return this.error || '操作成功'
  }
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
