/**
 * 公开表单 ViewModel
 */
import { formService } from '../service/FormService'
import { recordService } from '../service/RecordService'
import { aiService } from '../service/AiService'
import type { Form, Field } from '../model/types'
import { showToast } from '../util/toast'

export class FormViewModel {
  form: Form | null = null
  fields: Field[] = []
  formValues: Record<string, any> = {}
  loading: boolean = true
  submitting: boolean = false
  submitted: boolean = false
  errorMsg: string = ''
  successMessage: string = ''

  get formKey(): string {
    // 从路由参数获取
    const params = router.getParams() as Record<string, string>
    return params?.formKey || ''
  }

  async load(): Promise<void> {
    this.loading = true
    try {
      // 获取表单信息
      const formResult = await formService.submit(this.formKey, { data: {} })
      // 实际上公开表单不需要先调用，直接提交
      // 这里用 list 接口来验证表单存在
    } catch {
      this.errorMsg = '表单不存在或已失效'
    } finally {
      this.loading = false
    }
  }

  /** 从 URL 加载表单元信息（需要调用专用接口） */
  async loadFormMeta(tableId: number): Promise<void> {
    try {
      const result = await formService.list(tableId)
      if (result.isSuccess && result.data && result.data.length > 0) {
        this.form = result.data[0]
        // 从第一条记录的字段推断表单字段
        const records = await recordService.list(tableId, { page: 1, per_page: 1 })
        if (records.isSuccess && records.data?.records?.[0]) {
          const firstRecord = records.data.records[0]
          this.fields = Object.keys(firstRecord.data).map(name => ({
            name,
            type: 'text'
          }))
        }
        this.initFormValues()
      }
    } catch {
      this.errorMsg = '加载失败'
    } finally {
      this.loading = false
    }
  }

  private initFormValues(): void {
    this.fields.forEach(f => {
      this.formValues[f.name] = f.type === 'checkbox' ? [] : ''
    })
  }

  async submitForm(): Promise<boolean> {
    this.submitting = true
    this.errorMsg = ''

    try {
      const result = await formService.submit(this.formKey, { data: this.formValues })

      if (result.isSuccess) {
        // AI 生成成功文案
        this.successMessage = await aiService.generateSuccessMessage(this.form?.name || '表单')
        this.submitted = true
        return true
      }

      this.errorMsg = result.message
      return false
    } catch {
      this.errorMsg = '提交失败，请稍后重试'
      return false
    } finally {
      this.submitting = false
    }
  }
}

import router from '@ohos.router'
