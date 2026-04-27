/**
 * 用户管理页（管理员）
 */
import http from '@ohos.net.http'
import type { UserInfo } from '../model/types'
import { showToast } from '../util/toast'

interface UserListResult {
  users: UserInfo[]
  total: number
  page: number
  pages: number
}

@Entry
@Component
struct UserManagementPage {
  @State users: UserInfo[] = []
  @State loading: boolean = false
  @State search: string = ''
  @State page: number = 1
  @State totalPages: number = 1
  @State currentUserId: number = 0

  async aboutToAppear() {
    await this.loadUsers()
  }

  async loadUsers(): Promise<void> {
    this.loading = true
    try {
      const client = http.createHttp()
      const token = AppStorage.get('lingda_token') as string

      const resp = await client.request(
        `http://10.11.146.184:5000/api/users?page=${this.page}&search=${this.search}`,
        {
          method: http.RequestMethod.GET,
          header: { 'Authorization': `Bearer ${token}` },
          connectTimeout: 15000,
          readTimeout: 15000
        }
      )

      if (resp.responseCode === 200) {
        const data = JSON.parse(resp.result as string) as UserListResult
        this.users = data.users || []
        this.totalPages = data.pages || 1
      }
      client.destroy()
    } catch {
      showToast('加载失败')
    } finally {
      this.loading = false
    }
  }

  debounceSearch(): void {
    this.page = 1
    this.loadUsers()
  }

  async toggleAdmin(user: UserInfo): Promise<void> {
    try {
      const client = http.createHttp()
      const token = AppStorage.get('lingda_token') as string

      const resp = await client.request(
        `http://10.11.146.184:5000/api/users/batch`,
        {
          method: http.RequestMethod.POST,
          header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          extraData: JSON.stringify({ action: user.is_admin ? 'revoke_admin' : 'grant_admin', user_id: user.id }),
          connectTimeout: 15000,
          readTimeout: 15000
        }
      )

      if (resp.responseCode === 200) {
        const idx = this.users.findIndex(u => u.id === user.id)
        if (idx >= 0) this.users[idx] = { ...user, is_admin: !user.is_admin }
        showToast(user.is_admin ? '已撤销管理员' : '已设为管理员')
      } else {
        showToast('操作失败')
      }
      client.destroy()
    } catch {
      showToast('操作失败')
    }
  }

  async deleteUser(user: UserInfo): Promise<void> {
    try {
      const client = http.createHttp()
      const token = AppStorage.get('lingda_token') as string

      const resp = await client.request(
        `http://10.11.146.184:5000/api/users/${user.id}`,
        {
          method: http.RequestMethod.DELETE,
          header: { 'Authorization': `Bearer ${token}` },
          connectTimeout: 15000,
          readTimeout: 15000
        }
      )

      if (resp.responseCode === 200) {
        this.users = this.users.filter(u => u.id !== user.id)
        showToast('已删除')
      } else {
        showToast('删除失败')
      }
      client.destroy()
    } catch {
      showToast('删除失败')
    }
  }

  build() {
    Column() {
      // 顶部
      Row() {
        Text('<')
          .fontSize(22)
          .onClick(() => router.back())
        Text('用户管理')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .margin({ left: 8 })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor('#fff')

      // 搜索
      TextInput({ placeholder: '搜索用户邮箱或姓名...', text: this.search })
        .height(40)
        .borderRadius(10)
        .backgroundColor('#f1f5f9')
        .margin({ left: 16, right: 16, top: 8 })
        .onChange(v => { this.search = v; this.debounceSearch() })

      // 用户列表
      if (this.loading) {
        LoadingProgress().width(40).height(40).margin({ top: 40 })
      } else {
        List() {
          ForEach(this.users, (user) => {
            ListItem() {
              Row() {
                Column() {
                  Text(user.name || user.email)
                    .fontSize(15)
                    .fontWeight(FontWeight.Medium)
                  Text(user.email)
                    .fontSize(12)
                    .fontColor('#94a3b8')
                    .margin({ top: 2 })
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)

                if (user.is_admin) {
                  Text('管理员')
                    .fontSize(11)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .backgroundColor('#4f46e5')
                    .fontColor('#fff')
                    .borderRadius(10)
                }

                if (user.id !== this.currentUserId) {
                  Row({ space: 8 }) {
                    Button(user.is_admin ? '撤销' : '设为管理员')
                      .fontSize(11)
                      .height(28)
                      .borderRadius(6)
                      .backgroundColor('#f1f5f9')
                      .fontColor('#4f46e5')
                      .onClick(() => this.toggleAdmin(user))

                    Text('删除')
                      .fontSize(12)
                      .fontColor('#dc2626')
                      .onClick(() => this.deleteUser(user))
                  }
                }
              }
              .width('100%')
              .padding(16)
            }
            .backgroundColor('#fff')
            .borderRadius(12)
            .margin({ left: 16, right: 16, top: 8 })
          })
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)
        .margin({ top: 8 })

        // 分页
        if (this.totalPages > 1) {
          Row() {
            Button('<')
              .enabled(this.page > 1)
              .onClick(() => { this.page--; this.loadUsers() })
            Text(`${this.page} / ${this.totalPages}`)
              .fontSize(14)
              .padding({ left: 16, right: 16 })
            Button('>')
              .enabled(this.page < this.totalPages)
              .onClick(() => { this.page++; this.loadUsers() })
          }
          .padding(16)
          .backgroundColor('#fff')
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f1f5f9')
  }
}

import router from '@ohos.router'
