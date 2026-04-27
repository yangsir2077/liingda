/**
 * AI 数据分析面板
 * 挂在 TableDetailPage，记录分析按钮旁
 */
import { aiService } from '../../service/AiService'
import type { DataSummary } from '../../service/AiService'
import { showToast } from '../../util/toast'

@Component
export struct AiDataPanel {
  @Link records: Record<string, any>[]
  @Link fields: Array<{ name: string; type: string }>
  tableName: string = ''
  @State analyzing: boolean = false
  @State summary: DataSummary | null = null
  @State showPanel: boolean = false

  build() {
    Column() {
      // 触发按钮
      Row() {
        Text('🤖 AI 分析')
          .fontSize(13)
          .fontColor('#059669')
        Blank()
        if (this.analyzing) {
          LoadingProgress().width(16).height(16)
          Text('分析中...').fontSize(12).fontColor('#94a3b8').margin({ left: 6 })
        } else {
          Text('数据洞察').fontSize(12).fontColor('#94a3b8')
        }
      }
      .width('100%')
      .padding(12)
      .backgroundColor('#f0fdf4')
      .borderRadius(10)
      .border({ width: 1, color: '#bbf7d0' })
      .onClick(() => this.runAnalysis())

      // 分析结果
      if (this.showPanel && this.summary) {
        Column({ space: 12 }) {
          Row() {
            Text('📊 数据洞察')
              .fontSize(13)
              .fontWeight(FontWeight.Bold)
              .fontColor('#059669')
            Text(`共 ${this.summary.total} 条`)
              .fontSize(12)
              .fontColor('#94a3b8')
              .margin({ left: 8 })
            Blank()
            Text('×')
              .fontSize(18)
              .fontColor('#94a3b8')
              .onClick(() => this.showPanel = false)
          }

          if (this.summary.insight) {
            Text(this.summary.insight)
              .fontSize(14)
              .fontColor('#1e293b')
              .width('100%')
              .padding(12)
              .backgroundColor('#f0fdf4')
              .borderRadius(8)
          }

          if (this.summary.trends.length > 0) {
            Text('📈 趋势')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor('#64748b')
              .alignSelf(ItemAlign.Start)
            ForEach(this.summary.trends, (t) => {
              Row() {
                Text('•').fontColor('#059669')
                Text(t).fontSize(13).fontColor('#1e293b').margin({ left: 6 })
              }
              .width('100%')
            })
          }

          if (this.summary.alerts.length > 0) {
            Text('⚠️ 关注点')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor('#64748b')
              .alignSelf(ItemAlign.Start)
              .margin({ top: 4 })
            ForEach(this.summary.alerts, (a) => {
              Row() {
                Text('•').fontColor('#d97706')
                Text(a).fontSize(13).fontColor('#1e293b').margin({ left: 6 })
              }
              .width('100%')
            })
          }
        }
        .width('100%')
        .margin({ top: 12 })
        .padding(16)
        .backgroundColor('#fff')
        .borderRadius(12)
        .border({ width: 1, color: '#bbf7d0' })
      }
    }
  }

  async runAnalysis(): Promise<void> {
    if (this.records.length === 0) {
      showToast('暂无数据可分析')
      return
    }

    this.analyzing = true
    try {
      const fieldNames = this.fields.map(f => f.name)
      const result = await aiService.analyzeRecords(this.tableName, fieldNames, this.records)
      this.summary = result
      this.showPanel = true
    } catch {
      showToast('AI 分析失败')
    } finally {
      this.analyzing = false
    }
  }
}
