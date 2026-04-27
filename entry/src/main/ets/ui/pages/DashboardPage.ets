/**
 * 首页仪表盘
 */
import { DashboardViewModel } from '../viewmodel/DashboardViewModel'
import { AppCard } from '../ui/components/AppCard'
import { getIconData } from '../model/icons'

@Entry
@Component
struct DashboardPage {
  @State vm: DashboardViewModel = new DashboardViewModel()

  async aboutToAppear() {
    await this.vm.load()
  }

  build() {
    Stack({ alignContent: Alignment.Top }) {
      // 背景
      Column()
        .width('100%')
        .height('100%')
        .backgroundColor('#f1f5f9')

      Column() {
        // 顶部栏
        Row() {
          Column() {
            Text('零搭')
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor('#1e293b')
            Text('NoCode 平台')
              .fontSize(12)
              .fontColor('#94a3b8')
          }
          .alignItems(HorizontalAlign.Start)

          Blank()

          Image($r('app.media.ic_user'))
            .width(32)
            .height(32)
            .borderRadius(16)
            .onClick(() => this.vm.openProfile())
        }
        .width('100%')
        .padding({ left: 20, right: 20, top: 16, bottom: 12 })

        // 统计卡片
        Scroll() {
          Row({ space: 12 }) {
            StatCard({ title: '应用总数', value: String(this.vm.apps.length), color: '#4f46e5' })
            StatCard({ title: '数据表', value: String(this.vm.totalTables), color: '#059669' })
            StatCard({ title: '记录数', value: String(this.vm.totalRecords), color: '#d97706' })
            StatCard({ title: '公开表单', value: String(this.vm.totalForms), color: '#dc2626' })
          }
          .padding({ left: 20, right: 20 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .edgeEffect(EdgeEffect.Spring)
        .height(100)

        // 应用列表
        List({ space: 12 }) {
          ForEach(this.vm.apps, (app) => {
            ListItem() {
              AppCard({
                app: app,
                onTap: () => this.vm.openApp(app),
                onDelete: () => this.vm.deleteApp(app)
              })
            }
          })

          ListItem() {
            // 新建应用卡片
            Column() {
              Text('+')
                .fontSize(32)
                .fontColor('#94a3b8')
              Text('新建应用')
                .fontSize(14)
                .fontColor('#94a3b8')
                .margin({ top: 8 })
            }
            .width('100%')
            .height(100)
            .justifyContent(FlexAlign.Center)
            .alignItems(HorizontalAlign.Center)
            .backgroundColor('#fff')
            .borderRadius(16)
            .border({
              width: 2,
              color: '#e2e8f0',
              style: BorderStyle.Dashed
            })
            .onClick(() => this.vm.showCreate = true)
          }
        }
        .padding({ left: 20, right: 20, top: 16 })
        .layoutWeight(1)
        .width('100%')

        // 底部 TabBar
        Row() {
          TabBarItem({ icon: 'home', title: '首页', active: true })
          TabBarItem({ icon: 'user', title: '我的', active: false, onTap: () => this.vm.openProfile() })
        }
        .width('100%')
        .padding({ left: 20, right: 20, top: 12, bottom: 24 })
        .backgroundColor('#fff')
      }
      .width('100%')
      .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}

@Component
struct StatCard {
  title: string = ''
  value: string = ''
  color: string = '#4f46e5'

  build() {
    Column() {
      Text(this.value)
        .fontSize(28)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.color)
      Text(this.title)
        .fontSize(12)
        .fontColor('rgba(0,0,0,0.5)')
        .margin({ top: 4 })
    }
    .width(80)
    .height(80)
    .backgroundColor('#fff')
    .borderRadius(16)
    .justifyContent(FlexAlign.Center)
    .shadow({
      radius: 8,
      color: 'rgba(0,0,0,0.06)',
      offsetX: 0,
      offsetY: 2
    })
  }
}

@Component
struct TabBarItem {
  icon: string = ''
  title: string = ''
  active: boolean = false
  onTap: () => void = () => {}

  build() {
    Column() {
      Text(this.icon === 'home' ? '🏠' : '👤')
        .fontSize(22)
      Text(this.title)
        .fontSize(11)
        .fontColor(this.active ? '#4f46e5' : '#94a3b8')
        .margin({ top: 4 })
    }
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .onClick(() => this.onTap())
  }
}
