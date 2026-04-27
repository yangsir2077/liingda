/**
 * 个人中心页
 */
import { AuthViewModel } from '../viewmodel/AuthViewModel'
import { authService } from '../service/AuthService'
import type { UserInfo } from '../model/types'
import { showToast } from '../util/toast'
import promptAction from '@ohos.promptAction'

@Entry
@Component
struct ProfilePage {
  @State user: UserInfo | null = null
  @State loading: boolean = false
  @State showPasswordModal: boolean = false
  @State oldPassword: string = ''
  @State newPassword: string = ''

  async aboutToAppear() {
    const result = await authService.getCurrentUser()
    if (result.isSuccess) this.user = result.data
  }

  build() {
    Column() {
      // 顶部
      Row() {
        Text('<')
          .fontSize(22)
          .fontColor('#1e293b')
          .onClick(() => router.back())
        Text('个人中心')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .margin({ left: 8 })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 16 })
      .backgroundColor('#fff')

      Scroll() {
        Column({ space: 16 }) {
          // 用户信息卡片
          Column() {
            Row() {
              Column() {
                Text(this.user?.name || this.user?.email || '用户')
                  .fontSize(20)
                  .fontWeight(FontWeight.Bold)
                Text(this.user?.email || '')
                  .fontSize(14)
                  .fontColor('#94a3b8')
                  .margin({ top: 4 })
                if (this.user?.is_admin) {
                  Text('管理员')
                    .fontSize(11)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .backgroundColor('#4f46e5')
                    .fontColor('#fff')
                    .borderRadius(10)
                    .margin({ top: 8 })
                }
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)
            }
          }
          .width('100%')
          .padding(20)
          .backgroundColor('#fff')
          .borderRadius(16)

          // 功能菜单
          Column() {
            MenuItem({ title: '修改密码', icon: '🔒', onTap: () => this.showPasswordModal = true })
            Divider().color('#f1f5f9')
            MenuItem({ title: '退出登录', icon: '🚪', onTap: () => this.logout() })
          }
          .width('100%')
          .backgroundColor('#fff')
          .borderRadius(16)
          .padding({ left: 20, right: 20 })

          // 版本信息
          Text('零搭 v0.2 · HarmonyOS App')
            .fontSize(12)
            .fontColor('#94a3b8')
            .margin({ top: 20 })
        }
        .padding({ left: 20, right: 20, top: 12, bottom: 24 })
      }
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f1f5f9')
  }

  async logout(): Promise<void> {
    const confirmed = await promptAction.showDialog({
      title: '退出登录',
      message: '确定退出当前账号？',
      buttons: [{ text: '取消', color: '#64748b' }, { text: '确定', color: '#dc2626' }]
    })
    if (confirmed?.index === 1) {
      authService.logout()
      router.replaceUrl({ url: 'pages/LoginPage' })
    }
  }
}

@Component
struct MenuItem {
  title: string = ''
  icon: string = ''
  onTap: () => void = () => {}

  build() {
    Row() {
      Text(this.icon).fontSize(20)
      Text(this.title)
        .fontSize(15)
        .fontColor('#1e293b')
        .layoutWeight(1)
        .margin({ left: 12 })
      Text('>')
        .fontSize(16)
        .fontColor('#cbd5e1')
    }
    .width('100%')
    .padding({ top: 16, bottom: 16 })
    .onClick(() => this.onTap())
  }
}

import router from '@ohos.router'
