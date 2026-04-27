/**
 * 数据管理 ViewModel
 * 支持列表/看板/日历/图册 4种视图
 */
import { tableService } from '../service/TableService'
import { recordService } from '../service/RecordService'
import type { Table, Record, Field, ViewMode, KanbanColumn } from '../model/types'
import { showToast } from '../util/toast'
import router from '@ohos.router'

export class TableDetailViewModel {
  table: Table | null = null
  records: Record[] = []
  total: number = 0
  page: number = 1
  perPage: number = 20
  pages: number = 1
  search: string = ''
  sortField: string = ''
  sortOrder: 'asc' | 'desc' = 'desc'

  // 视图模式
  viewMode: ViewMode = 'list'

  // 看板
  kanbanGroupBy: string = ''
  kanbanColumns: KanbanColumn[] = []
  kanbanFields: Field[] = []

  // 日历
  calDateField: string = ''
  calYear: number = new Date().getFullYear()
  calMonth: number = new Date().getMonth() + 1
  calCells: Array<{ date: Date; isCurrentMonth: boolean; records: Record[] }> = []
  calEventColors: string[] = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed']

  // 图册
  galleryField: string = ''

  // 模态框
  showModal: boolean = false
  editingRecord: Record | null = null
  formData: Record<string, any> = {}
  saving: boolean = false

  // 多选
  selectedIds: Set<number> = new Set()
  showBatchPanel: boolean = false
  batchField: string = ''
  batchValue: string = ''

  get tableId(): number {
    const params = router.getParams() as Record<string, string | number>
    return Number(params?.tableId || 0)
  }

  async load(): Promise<void> {
    try {
      const [tableResult, recordsResult] = await Promise.all([
        tableService.get(this.tableId),
        recordService.list(this.tableId, {
          page: this.page,
          per_page: this.perPage,
          search: this.search,
          sort: this.sortField,
          order: this.sortOrder
        })
      ])

      if (tableResult.isSuccess && tableResult.data) {
        this.table = tableResult.data
        this.initKanban()
        this.initCalendar()
      }

      if (recordsResult.isSuccess && recordsResult.data) {
        this.records = recordsResult.data.records ?? []
        this.total = recordsResult.data.total ?? 0
        this.pages = recordsResult.data.pages ?? 1
      }
    } catch {
      showToast('加载失败')
    }
  }

  private initKanban(): void {
    if (!this.table) return
    const selectFields = this.table.fields.filter(f => f.type === 'select')
    if (selectFields.length > 0) {
      this.kanbanGroupBy = selectFields[0].name
      this.kanbanFields = selectFields
      this.buildKanbanColumns()
    }
  }

  buildKanbanColumns(): void {
    if (!this.table || !this.kanbanGroupBy) return
    const field = this.table.fields.find(f => f.name === this.kanbanGroupBy)
    if (!field?.options) return

    const colorMap = this.calEventColors
    this.kanbanColumns = field.options.map((opt, i) => ({
      value: opt,
      label: opt,
      color: colorMap[i % colorMap.length],
      records: this.records.filter(r => r.data[this.kanbanGroupBy] === opt)
    }))
    // 加上空值列
    const emptyRecords = this.records.filter(r => !r.data[this.kanbanGroupBy])
    if (emptyRecords.length > 0) {
      this.kanbanColumns.push({ value: '', label: '(空)', color: '#94a3b8', records: emptyRecords })
    }
  }

  private initCalendar(): void {
    if (!this.table) return
    const dateFields = this.table.fields.filter(f => f.type === 'date')
    if (dateFields.length > 0) {
      this.calDateField = dateFields[0].name
      this.buildCalendar()
    }
  }

  buildCalendar(): void {
    if (!this.table || !this.calDateField) return
    const y = this.calYear
    const m = this.calMonth
    const firstDay = new Date(y, m - 1, 1)
    const lastDay = new Date(y, m, 0)
    let startDow = firstDay.getDay()
    startDow = startDow === 0 ? 6 : startDow - 1

    this.calCells = []
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(y, m - 1, -i)
      this.calCells.push({ date: d, isCurrentMonth: false, records: [] })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(y, m - 1, d)
      const records = this.records.filter(r => {
        const val = r.data[this.calDateField]
        if (!val) return false
        const recordDate = new Date(val)
        return recordDate.toDateString() === date.toDateString()
      })
      this.calCells.push({ date, isCurrentMonth: true, records })
    }
    while (this.calCells.length < 42) {
      const d = new Date(y, m, this.calCells.length - startDow - lastDay.getDate())
      this.calCells.push({ date: d, isCurrentMonth: false, records: [] })
    }
  }

  calPrevMonth(): void {
    if (this.calMonth === 1) { this.calYear--; this.calMonth = 12 }
    else this.calMonth--
    this.buildCalendar()
  }

  calNextMonth(): void {
    if (this.calMonth === 12) { this.calYear++; this.calMonth = 1 }
    else this.calMonth++
    this.buildCalendar()
  }

  calToday(): void {
    const now = new Date()
    this.calYear = now.getFullYear()
    this.calMonth = now.getMonth() + 1
    this.buildCalendar()
  }

  async loadRecords(): Promise<void> {
    const result = await recordService.list(this.tableId, {
      page: this.page,
      per_page: this.perPage,
      search: this.search,
      sort: this.sortField,
      order: this.sortOrder
    })
    if (result.isSuccess && result.data) {
      this.records = result.data.records ?? []
      this.total = result.data.total ?? 0
      this.pages = result.data.pages ?? 1
      if (this.viewMode === 'kanban') this.buildKanbanColumns()
    }
  }

  debounceSearch(): void {
    this.page = 1
    this.loadRecords()
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortOrder = 'desc'
    }
    this.page = 1
    this.loadRecords()
  }

  // 记录操作
  openAdd(): void {
    this.editingRecord = null
    this.formData = {}
    this.table?.fields.forEach(f => {
      this.formData[f.name] = f.type === 'checkbox' ? [] : ''
    })
    this.showModal = true
  }

  editRecord(r: Record): void {
    this.editingRecord = r
    this.formData = { ...r.data }
    this.showModal = true
  }

  async saveRecord(): Promise<boolean> {
    this.saving = true
    try {
      const req = { data: this.formData }
      const result = this.editingRecord
        ? await recordService.update(this.editingRecord.id, req)
        : await recordService.create(this.tableId, req)

      if (result.isSuccess) {
        showToast(this.editingRecord ? '更新成功' : '创建成功')
        this.showModal = false
        await this.loadRecords()
        return true
      }
      showToast(result.message)
      return false
    } catch {
      showToast('保存失败')
      return false
    } finally {
      this.saving = false
    }
  }

  async deleteRecord(r: Record): Promise<boolean> {
    try {
      const result = await recordService.delete(r.id)
      if (result.isSuccess) {
        this.records = this.records.filter(x => x.id !== r.id)
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

  // 看板拖拽
  kanbanDragStart(r: Record): void {}

  kanbanDragOver(column: KanbanColumn): void {}

  async kanbanDrop(column: KanbanColumn, r: Record): Promise<void> {
    const result = await recordService.update(r.id, { data: { ...r.data, [this.kanbanGroupBy]: column.value } })
    if (result.isSuccess) {
      await this.loadRecords()
    }
  }

  openAddForColumn(col: KanbanColumn): void {
    this.openAdd()
    this.formData[this.kanbanGroupBy] = col.value
  }

  // 多选
  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id)
    else this.selectedIds.add(id)
  }

  toggleSelectAll(): void {
    if (this.selectedIds.size === this.records.length) this.selectedIds.clear()
    else this.records.forEach(r => this.selectedIds.add(r.id))
  }

  async batchDelete(): Promise<void> {
    const ids = [...this.selectedIds]
    const result = await recordService.batch(this.tableId, { action: 'delete', ids })
    if (result.isSuccess) {
      showToast(`已删除 ${ids.length} 条`)
      this.selectedIds.clear()
      this.showBatchPanel = false
      await this.loadRecords()
    }
  }

  async batchUpdateField(): Promise<void> {
    if (!this.batchField || !this.batchValue) return
    const ids = [...this.selectedIds]
    const result = await recordService.batch(this.tableId, {
      action: 'update',
      ids,
      data: { [this.batchField]: this.batchValue }
    })
    if (result.isSuccess) {
      showToast(`已更新 ${ids.length} 条`)
      this.selectedIds.clear()
      this.showBatchPanel = false
      await this.loadRecords()
    }
  }

  goBack(): void {
    router.back()
  }
}
