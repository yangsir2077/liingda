/**
 * 首页仪表盘 ViewModel
 */
import { appService } from '../service/AppService'
import type { App, AppStats } from '../model/types'
import { showToast } from '../util/toast'
import router from '@ohos.router'

export class DashboardViewModel {
  apps: App[] = []
  stats: AppStats | null = null
  loading: boolean = false
  showCreate: boolean = false
  creating: boolean = false

  // 新建应用表单
  newApp = {
    name: '',
    icon: '文档',
    description: ''
  }

  get totalTables(): number {
    return this.stats?.table_count ?? this.apps.reduce((sum, a) => sum + a.table_count, 0)
  }

  get totalRecords(): number {
    return this.stats?.record_count ?? this.apps.reduce((sum, a) => sum + a.record_count, 0)
  }

  get totalForms(): number {
    return this.stats?.form_count ?? 0
  }

  async load(): Promise<void> {
    this.loading = true
    try {
      const [appsResult, statsResult] = await Promise.all([
        appService.list(),
        appService.stats()
      ])

      if (appsResult.isSuccess) {
        this.apps = appsResult.data ?? []
      }

      if (statsResult.isSuccess) {
        this.stats = statsResult.data ?? null
      }
    } catch (e) {
      showToast('加载失败')
    } finally {
      this.loading = false
    }
  }

  async createApp(): Promise<boolean> {
    if (!this.newApp.name.trim()) {
      showToast('请输入应用名称')
      return false
    }

    this.creating = true
    try {
      const result = await appService.create({
        name: this.newApp.name.trim(),
        icon: this.newApp.icon,
        description: this.newApp.description.trim() || undefined
      })

      if (result.isSuccess && result.data) {
        this.apps.unshift(result.data)
        this.showCreate = false
        this.newApp = { name: '', icon: '文档', description: '' }
        showToast('应用创建成功')
        router.pushUrl({ url: 'pages/AppDetailPage', params: { appId: result.data.id } })
        return true
      }

      showToast(result.message)
      return false
    } catch (e) {
      showToast('创建失败')
      return false
    } finally {
      this.creating = false
    }
  }

  async deleteApp(app: App): Promise<boolean> {
    try {
      const result = await appService.delete(app.id)
      if (result.isSuccess) {
        this.apps = this.apps.filter(a => a.id !== app.id)
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

  openApp(app: App): void {
    router.pushUrl({ url: 'pages/AppDetailPage', params: { appId: app.id } })
  }

  openProfile(): void {
    router.pushUrl({ url: 'pages/ProfilePage' })
  }
}
