/**
 * 零搭 NoCode Platform - 类型定义
 */

// ============ 认证相关 ============
export interface LoginReq {
  email: string
  password: string
}

export interface RegisterReq {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  token: string
  user: UserInfo
  need_verify?: boolean
  email?: string
}

export interface VerifyEmailReq {
  email: string
  code: string
}

export interface SendResetCodeReq {
  email: string
}

export interface ResetPasswordReq {
  email: string
  code: string
  password: string
}

// ============ 用户 ============
export interface UserInfo {
  id: number
  email: string
  name?: string
  is_admin: boolean
  created_at: string
}

// ============ 应用 ============
export interface App {
  id: number
  name: string
  description?: string
  icon: string
  table_count: number
  record_count: number
  form_count: number
  created_at: string
  updated_at: string
  tables?: Table[]
}

export interface CreateAppReq {
  name: string
  icon?: string
  description?: string
}

export interface AppStats {
  app_count: number
  table_count: number
  record_count: number
  form_count: number
}

// ============ 数据表 ============
export interface Table {
  id: number
  name: string
  fields: Field[]
  record_count: number
  created_at: string
  updated_at: string
}

export interface Field {
  name: string
  type: FieldType
  required?: boolean
  pattern?: string
  customPattern?: string
  options?: string[]
}

export type FieldType =
  | 'text' | 'number' | 'select' | 'checkbox'
  | 'date' | 'textarea' | 'phone' | 'email'
  | 'url' | 'currency' | 'desc' | 'separator'

export interface CreateTableReq {
  name: string
  fields: Field[]
}

export const FIELD_TYPES: Array<{ value: FieldType; label: string; icon: string }> = [
  { value: 'text', label: '文本', icon: 'T' },
  { value: 'number', label: '数字', icon: '#' },
  { value: 'select', label: '下拉', icon: '▼' },
  { value: 'checkbox', label: '复选', icon: '☑' },
  { value: 'date', label: '日期', icon: '📅' },
  { value: 'textarea', label: '多行文本', icon: '≡' },
  { value: 'phone', label: '手机号', icon: '📞' },
  { value: 'email', label: '邮箱', icon: '✉' },
  { value: 'url', label: '网址', icon: '🔗' },
  { value: 'currency', label: '金额', icon: '¥' },
  { value: 'desc', label: '说明文字', icon: 'ℹ' },
  { value: 'separator', label: '分段线', icon: '—' },
]

// ============ 记录 ============
export interface Record {
  id: number
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateRecordReq {
  data: Record<string, any>
}

export interface BatchReq {
  action: 'delete' | 'update'
  ids: number[]
  data?: Record<string, any>
}

export interface ImportResult {
  total: number
  imported: number
  failed: number
  errors?: string[]
}

// ============ 公开表单 ============
export interface Form {
  id: number
  name: string
  description?: string
  table_id: number
  public_key: string
  created_at: string
}

export interface CreateFormReq {
  name: string
  description?: string
}

export interface FormSubmitReq {
  data: Record<string, any>
}

// ============ 视图模式 ============
export type ViewMode = 'list' | 'kanban' | 'calendar' | 'gallery'

// ============ 看板视图 ============
export interface KanbanColumn {
  value: string
  label: string
  color?: string
  records: Record[]
}

// ============ 日历视图 ============
export interface CalendarCell {
  date: Date
  isCurrentMonth: boolean
  records: Record[]
}
