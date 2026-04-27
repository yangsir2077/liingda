/**
 * 应用详情 ViewModel
 */
import { appService } from '../service/AppService'
import { tableService } from '../service/TableService'
import type { App, Table } from '../model/types'
import { showToast } from '../util/toast'
import router from '@ohos.router'

export class AppDetailViewModel {
  app: App | null = null
  tables: Table[] = []
  loading: boolean = false
  showBuilder: boolean = false
  editingTable: Table | null = null
  saving: boolean = false

  // 建表表单
  tableForm = {
    name: '',
    fields: Array<{ name: string; type: string; required: boolean; options: string[] }>()
  }

  get appId(): number {
    // 从路由参数获取
    const params = router.getParams() as Record<string, string | number>
    return Number(params?.appId || 0)
  }

  async load(): Promise<void> {
    this.loading = true
    try {
      const result = await appService.get(this.appId)
      if (result.isSuccess && result.data) {
        this.app = result.data
        this.tables = result.data.tables || []
      } else {
        showToast(result.message)
      }
    } catch {
      showToast('加载失败')
    } finally {
      this.loading = false
    }
  }

  openTable(t: Table): void {
    router.pushUrl({ url: 'pages/TableDetailPage', params: { appId: this.appId, tableId: t.id } })
  }

  openBuilder(): void {
    this.editingTable = null
    this.tableForm = {
      name: '',
      fields: [{ name: '标题', type: 'text', required: true, options: [] }]
    }
    this.showBuilder = true
  }

  editTable(t: Table): void {
    this.editingTable = t
    this.tableForm = {
      name: t.name,
      fields: t.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required || false,
        options: f.options ? [...f.options] : []
      }))
    }
    this.showBuilder = true
  }

  addField(type: string = 'text'): void {
    this.tableForm.fields.push({ name: '', type, required: false, options: [] })
  }

  removeField(i: number): void {
    this.tableForm.fields.splice(i, 1)
  }

  async saveTable(): Promise<boolean> {
    if (!this.tableForm.name.trim()) {
      showToast('请输入表名')
      return false
    }
    if (!this.tableForm.fields.length) {
      showToast('请至少添加一个字段')
      return false
    }

    this.saving = true
    try {
      if (this.editingTable) {
        const result = await tableService.update(this.editingTable.id, {
          name: this.tableForm.name,
          fields: this.tableForm.fields
        })
        if (result.isSuccess) {
          const idx = this.tables.findIndex(t => t.id === this.editingTable!.id)
          if (idx >= 0) this.tables[idx] = { ...this.tables[idx], ...result.data!, fields: this.tableForm.fields }
          showToast('更新成功')
        } else {
          showToast(result.message); return false
        }
      } else {
        const result = await tableService.create(this.appId, {
          name: this.tableForm.name,
          fields: this.tableForm.fields
        })
        if (result.isSuccess && result.data) {
          this.tables.push({ ...result.data, fields: this.tableForm.fields, record_count: 0 })
          showToast('数据表创建成功')
        } else {
          showToast(result.message); return false
        }
      }
      this.showBuilder = false
      return true
    } catch {
      showToast('保存失败')
      return false
    } finally {
      this.saving = false
    }
  }

  async deleteTable(t: Table): Promise<boolean> {
    try {
      const result = await tableService.delete(t.id)
      if (result.isSuccess) {
        this.tables = this.tables.filter(x => x.id !== t.id)
        showToast('已删除')
        return true
      }
      showToast(result.message)
      return false
    } catch {
      showToast('删除失败')
      return false
    }
  }

  goBack(): void {
    router.back()
  }
}
