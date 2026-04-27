/**
 * 应用详情页
 */
import { AppDetailViewModel } from '../viewmodel/AppDetailViewModel'
import { FIELD_TYPES } from '../model/types'
import { getIconData } from '../model/icons'

@Entry
@Component
struct AppDetailPage {
  @State vm: AppDetailViewModel = new AppDetailViewModel()

  async aboutToAppear() {
    await this.vm.load()
  }

  build() {
    Stack() {
      Column() {
        // 顶部栏
        Row() {
          Text('<')
            .fontSize(24)
            .fontColor('#1e293b')
            .onClick(() => this.vm.goBack())

          Text(this.vm.app?.name || '加载中...')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .margin({ left: 12 })
            .layoutWeight(1)

          Button('添加数据表')
            .fontSize(13)
            .height(34)
            .borderRadius(8)
            .backgroundColor('#4f46e5')
            .onClick(() => this.vm.openBuilder())
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 12, bottom: 12 })
        .backgroundColor('#fff')

        if (this.vm.loading) {
          Column() {
            LoadingProgress()
              .width(40)
              .height(40)
          }
          .width('100%')
          .layoutWeight(1)
          .justifyContent(FlexAlign.Center)
        } else if (this.vm.tables.length === 0) {
          Column() {
            Text('📋')
              .fontSize(56)
            Text('还没有数据表')
              .fontSize(16)
              .fontColor('#94a3b8')
              .margin({ top: 12 })
            Button('新建数据表')
              .margin({ top: 16 })
              .backgroundColor('#4f46e5')
              .onClick(() => this.vm.openBuilder())
          }
          .width('100%')
          .layoutWeight(1)
          .justifyContent(FlexAlign.Center)
        } else {
          Scroll() {
            Column({ space: 12 }) {
              ForEach(this.vm.tables, (t) => {
                Row() {
                  Column() {
                    Text('📊')
                      .fontSize(24)
                  }
                  .width(44)
                  .height(44)
                  .backgroundColor('#EEF2FF')
                  .borderRadius(10)
                  .justifyContent(FlexAlign.Center)

                  Column() {
                    Text(t.name)
                      .fontSize(15)
                      .fontWeight(FontWeight.Bold)
                    Text(`${t.record_count} 条 · ${t.fields?.length || 0} 个字段`)
                      .fontSize(12)
                      .fontColor('#94a3b8')
                      .margin({ top: 2 })
                  }
                  .alignItems(HorizontalAlign.Start)
                  .layoutWeight(1)
                  .margin({ left: 12 })

                  Row({ space: 8 }) {
                    Button('编辑')
                      .fontSize(12)
                      .height(30)
                      .borderRadius(6)
                      .backgroundColor('#f1f5f9')
                      .fontColor('#64748b')
                      .onClick(() => this.vm.editTable(t))

                    Button('删除')
                      .fontSize(12)
                      .height(30)
                      .borderRadius(6)
                      .backgroundColor('#fef2f2')
                      .fontColor('#dc2626')
                      .onClick(() => this.vm.deleteTable(t))
                  }
                }
                .width('100%')
                .padding(16)
                .backgroundColor('#fff')
                .borderRadius(12)
                .onClick(() => this.vm.openTable(t))
              })
            }
            .padding({ left: 16, right: 16, top: 12 })
          }
          .layoutWeight(1)
        }
      }
      .width('100%')
      .height('100%')
      .backgroundColor('#f1f5f9')

      // 建表弹窗
      if (this.vm.showBuilder) {
        Column() {
          Column() {
            Row() {
              Text(this.vm.editingTable ? '编辑数据表' : '新建数据表')
                .fontSize(17)
                .fontWeight(FontWeight.Bold)
              Blank()
              Text('×')
                .fontSize(24)
                .fontColor('#94a3b8')
                .onClick(() => this.vm.showBuilder = false)
            }
            .width('100%')
            .padding(20)
            .border({ width: { bottom: 1 }, color: '#f1f5f9' })

            Scroll() {
              Column({ space: 12 }) {
                // 表名
                Column({ space: 6 }) {
                  Text('数据表名称')
                    .fontSize(13)
                    .fontColor('#64748b')
                    .alignSelf(ItemAlign.Start)
                  TextInput({ placeholder: '如：客户信息', text: this.vm.tableForm.name })
                    .height(44)
                    .borderRadius(10)
                    .backgroundColor('#f8fafc')
                }

                Text('字段设计')
                  .fontSize(14)
                  .fontWeight(FontWeight.Bold)
                  .alignSelf(ItemAlign.Start)
                  .margin({ top: 8 })

                // 字段类型快捷按钮
                Scroll() {
                  Row({ space: 8 }) {
                    ForEach(FIELD_TYPES, (type) => {
                      Text(`${type.icon} ${type.label}`)
                        .fontSize(12)
                        .padding({ left: 10, right: 10, top: 5, bottom: 5 })
                        .borderRadius(20)
                        .border({ width: 1, color: '#e2e8f0' })
                        .backgroundColor('#f8fafc')
                        .onClick(() => this.vm.addField(type.value))
                    })
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)

                // 字段列表
                ForEach(this.vm.tableForm.fields, (field: any, i: number) => {
                  Row() {
                    TextInput({ placeholder: '字段名称', text: field.name })
                      .layoutWeight(1)
                      .height(40)
                      .borderRadius(8)
                      .backgroundColor('#f8fafc')

                    Text(field.type.toUpperCase())
                      .fontSize(11)
                      .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                      .backgroundColor('#eef2ff')
                      .fontColor('#4f46e5')
                      .borderRadius(4)

                    Text('×')
                      .fontSize(18)
                      .fontColor('#dc2626')
                      .onClick(() => this.vm.removeField(i))
                  }
                  .width('100%')
                  .padding(12)
                  .backgroundColor('#fff')
                  .borderRadius(10)
                  .border({ width: 1, color: field.required ? '#4f46e5' : '#e2e8f0' })
                })
              }
              .padding(20)
            }
            .layoutWeight(1)

            // 底部按钮
            Row({ space: 12 }) {
              Button('取消')
                .layoutWeight(1)
                .height(46)
                .borderRadius(12)
                .backgroundColor('#f1f5f9')
                .fontColor('#64748b')
                .onClick(() => this.vm.showBuilder = false)

              Button(this.vm.saving ? '保存中...' : '保存')
                .layoutWeight(1)
                .height(46)
                .borderRadius(12)
                .backgroundColor('#4f46e5')
                .fontColor('#fff')
                .enabled(!this.vm.saving)
                .onClick(() => this.vm.saveTable())
            }
            .padding(20)
          }
          .width('100%')
          .height('80%')
          .backgroundColor('#fff')
          .borderRadius({ topLeft: 20, topRight: 20 })
        }
        .width('100%')
        .height('100%')
        .backgroundColor('rgba(0,0,0,0.4)')
        .justifyContent(FlexAlign.End)
      }
    }
    .width('100%')
    .height('100%')
  }
}
