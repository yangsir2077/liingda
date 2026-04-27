/**
 * AI 辅助建表组件
 * 在 AppDetailPage 中集成 AI 字段推荐
 */
import { aiService } from '../../service/AiService'
import type { AiSuggestion } from '../../service/AiService'
import { showToast } from '../../util/toast'

@Component
export struct AiFieldHelper {
  @Link appName: string
  @Link fields: Array<{ name: string; type: string; required: boolean; options: string[] }>
  @State suggesting: boolean = false
  @State suggestions: AiSuggestion[] = []
  @State showSuggestions: boolean = false

  build() {
    Column() {
      // AI 辅助按钮
      Row() {
        Text('🤖 AI 智能推荐')
          .fontSize(13)
          .fontColor('#7c3aed')
        Blank()
        if (this.suggesting) {
          LoadingProgress()
            .width(16)
            .height(16)
          Text('思考中...')
            .fontSize(12)
            .fontColor('#94a3b8')
            .margin({ left: 6 })
        } else {
          Text('点击让 AI 推荐字段')
            .fontSize(12)
            .fontColor('#94a3b8')
        }
      }
      .width('100%')
      .padding(12)
      .backgroundColor('#faf5ff')
      .borderRadius(10)
      .border({ width: 1, color: '#e9d5ff' })
      .onClick(() => this.suggestFields())

      // 推荐结果
      if (this.showSuggestions && this.suggestions.length > 0) {
        Column({ space: 8 }) {
          Row() {
            Text('AI 推荐字段')
              .fontSize(13)
              .fontWeight(FontWeight.Bold)
              .fontColor('#7c3aed')
            Blank()
            Text('×')
              .fontSize(18)
              .fontColor('#94a3b8')
              .onClick(() => this.showSuggestions = false)
          }
          .width('100%')

          ForEach(this.suggestions, (s) => {
            Row() {
              Column() {
                Text(s.field)
                  .fontSize(14)
                  .fontWeight(FontWeight.Medium)
                Text(`${s.type} · ${Math.round(s.confidence * 100)}% 置信度`)
                  .fontSize(11)
                  .fontColor('#94a3b8')
                  .margin({ top: 2 })
                Text(s.reason)
                  .fontSize(12)
                  .fontColor('#64748b')
                  .margin({ top: 4 })
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)

              Button('添加')
                .fontSize(12)
                .height(30)
                .borderRadius(8)
                .backgroundColor('#7c3aed')
                .fontColor('#fff')
                .onClick(() => this.addSuggestion(s))
            }
            .width('100%')
            .padding(12)
            .backgroundColor('#fff')
            .borderRadius(10)
            .border({ width: 1, color: '#e9d5ff' })
          })
        }
        .width('100%')
        .margin({ top: 12 })
      }
    }
  }

  async suggestFields(): Promise<void> {
    if (!this.appName.trim()) {
      showToast('请先输入应用名称')
      return
    }

    this.suggesting = true
    try {
      const result = await aiService.suggestFields(this.appName, '')
      if (result.length > 0) {
        this.suggestions = result
        this.showSuggestions = true
      } else {
        showToast('AI 暂未返回推荐，请重试')
      }
    } catch {
      showToast('AI 服务不可用')
    } finally {
      this.suggesting = false
    }
  }

  addSuggestion(s: AiSuggestion): void {
    const typeMap: Record<string, string> = {
      'text': 'text', 'number': 'number', 'select': 'select',
      'date': 'date', 'checkbox': 'checkbox', 'textarea': 'textarea'
    }
    const type = typeMap[s.type] || 'text'
    this.fields.push({ name: s.field, type, required: false, options: type === 'select' ? ['选项1', '选项2'] : [] })
    showToast(`已添加「${s.field}」`)
  }
}
