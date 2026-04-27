/**
 * 应用卡片组件
 */
import type { App } from '../../model/types'
import { ICON_COLORS } from '../../model/types'

@Component
export struct AppCard {
  @ObjectLink app: App
  onTap: () => void = () => {}
  onDelete: () => void = () => {}

  aboutToAppear() {
    // 获取图标颜色
  }

  build() {
    Row() {
      // 图标
      Column() {
        Text(ICON_COLORS[this.app.icon]?.emoji || '📄')
          .fontSize(24)
      }
      .width(48)
      .height(48)
      .backgroundColor(ICON_COLORS[this.app.icon]?.bg || '#EEF2FF')
      .borderRadius(12)
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)

      // 信息
      Column() {
        Text(this.app.name)
          .fontSize(16)
          .fontWeight(FontWeight.Bold)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })

        Text(this.app.description || '暂无描述')
          .fontSize(13)
          .fontColor('#94a3b8')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .margin({ top: 2 })

        Row() {
          Text(`${this.app.table_count} 个数据表`)
            .fontSize(12)
            .fontColor('#94a3b8')
        }
        .margin({ top: 4 })
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
      .margin({ left: 12 })
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#fff')
    .borderRadius(16)
    .shadow({
      radius: 8,
      color: 'rgba(0,0,0,0.06)',
      offsetX: 0,
      offsetY: 2
    })
    .onClick(() => this.onTap())
  }
}
