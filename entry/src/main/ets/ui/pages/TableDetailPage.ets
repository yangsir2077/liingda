/**
 * 数据管理主页 - 4种视图
 */
import { TableDetailViewModel } from '../viewmodel/TableDetailViewModel'
import type { ViewMode } from '../model/types'

@Entry
@Component
struct TableDetailPage {
  @State vm: TableDetailViewModel = new TableDetailViewModel()

  async aboutToAppear() {
    await this.vm.load()
  }

  build() {
    Stack() {
      Column() {
        // 顶部栏
        this.topBar()

        // 搜索栏
        Row() {
          TextInput({ placeholder: '搜索记录...', text: this.vm.search })
            .height(38)
            .borderRadius(8)
            .backgroundColor('#f1f5f9')
            .onChange(v => { this.vm.search = v; this.vm.debounceSearch() })
        }
        .padding({ left: 16, right: 16, top: 8, bottom: 8 })

        // 视图切换 Tab
        Row() {
          this.viewTab('列表', 'list')
          this.viewTab('看板', 'kanban')
          this.viewTab('日历', 'calendar')
          this.viewTab('图册', 'gallery')
        }
        .padding({ left: 16, right: 16, bottom: 8 })

        // 内容区
        if (this.vm.viewMode === 'list') this.listView()
        else if (this.vm.viewMode === 'kanban') this.kanbanView()
        else if (this.vm.viewMode === 'calendar') this.calendarView()
        else if (this.vm.viewMode === 'gallery') this.galleryView()
      }
      .width('100%')
      .height('100%')
      .backgroundColor('#f8fafc')

      // 新增按钮
      Button('+')
        .width(52)
        .height(52)
        .borderRadius(26)
        .fontSize(28)
        .fontColor('#fff')
        .backgroundColor('#4f46e5')
        .shadow({ radius: 8, color: 'rgba(79,70,229,0.4)', offsetX: 0, offsetY: 4 })
        .position({ x: '80%', y: '88%' })
        .onClick(() => this.vm.openAdd())

      // 记录编辑弹窗
      if (this.vm.showModal) this.recordModal()
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  topBar() {
    Row() {
      Text('<')
        .fontSize(22)
        .fontColor('#1e293b')
        .onClick(() => this.vm.goBack())

      Text(this.vm.table?.name || '数据管理')
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .margin({ left: 8 })
        .layoutWeight(1)

      if (this.vm.selectedIds.size > 0) {
        Text(`已选 ${this.vm.selectedIds.size}`)
          .fontSize(13)
          .fontColor('#4f46e5')
          .onClick(() => { this.vm.showBatchPanel = true })
      }
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 12, bottom: 8 })
    .backgroundColor('#fff')
  }

  @Builder
  viewTab(title: string, mode: ViewMode) {
    Column() {
      Text(title)
        .fontSize(13)
        .fontColor(this.vm.viewMode === mode ? '#4f46e5' : '#94a3b8')
        .fontWeight(this.vm.viewMode === mode ? FontWeight.Bold : FontWeight.Normal)
      Blank(3)
        .backgroundColor(this.vm.viewMode === mode ? '#4f46e5' : 'transparent')
        .width(this.vm.viewMode === mode ? 20 : 0)
        .height(2)
        .borderRadius(1)
    }
    .layoutWeight(1)
    .padding({ top: 8, bottom: 8 })
    .onClick(() => { this.vm.viewMode = mode; this.vm.load() })
  }

  // ============ 列表视图 ============
  @Builder
  listView() {
    Column() {
      // 表头
      if (this.vm.table) {
        Scroll() {
          Row() {
            ForEach(this.vm.table.fields.slice(0, 4), (field) => {
              Text(field.name)
                .fontSize(12)
                .fontColor('#94a3b8')
                .layoutWeight(1)
                .onClick(() => this.vm.toggleSort(field.name))
            })
            Text('操作')
              .fontSize(12)
              .fontColor('#94a3b8')
              .width(80)
          }
          .padding({ left: 16, right: 16, top: 8, bottom: 8 })
          .backgroundColor('#f1f5f9')
        }
        .height(36)
      }

      // 记录列表
      List() {
        ForEach(this.vm.records, (r) => {
          ListItem() {
            Row() {
              ForEach(this.vm.table?.fields.slice(0, 4) || [], (field) => {
                Text(String(r.data[field.name] ?? ''))
                  .fontSize(14)
                  .layoutWeight(1)
                  .maxLines(1)
                  .textOverflow({ overflow: TextOverflow.Ellipsis })
              })

              Row({ space: 8 }) {
                Text('编辑')
                  .fontSize(12)
                  .fontColor('#4f46e5')
                  .onClick(() => this.vm.editRecord(r))
                Text('删除')
                  .fontSize(12)
                  .fontColor('#dc2626')
                  .onClick(() => this.vm.deleteRecord(r))
              }
              .width(80)
              .justifyContent(FlexAlign.End)
            }
            .width('100%')
            .padding({ left: 16, right: 16, top: 12, bottom: 12 })
          }
          .backgroundColor('#fff')
          .borderRadius(12)
          .margin({ left: 16, right: 16, top: 6 })
          .onClick(() => this.vm.editRecord(r))
        })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)

      // 分页
      if (this.vm.pages > 1) {
        Row() {
          Button('<')
            .enabled(this.vm.page > 1)
            .onClick(() => { this.vm.page--; this.vm.loadRecords() })
          Text(`${this.vm.page} / ${this.vm.pages}`)
            .fontSize(14)
            .padding({ left: 16, right: 16 })
          Button('>')
            .enabled(this.vm.page < this.vm.pages)
            .onClick(() => { this.vm.page++; this.vm.loadRecords() })
        }
        .padding(16)
        .backgroundColor('#fff')
      }
    }
  }

  // ============ 看板视图 ============
  @Builder
  kanbanView() {
    Scroll() {
      Row({ space: 12 }) {
        ForEach(this.vm.kanbanColumns, (col) => {
          Column() {
            Row() {
              Text(col.label)
                .fontSize(13)
                .fontWeight(FontWeight.Bold)
              Text(` ${col.records.length}`)
                .fontSize(12)
                .fontColor('#94a3b8')
            }
            .width('100%')
            .padding(12)

            List() {
              ForEach(col.records, (r) => {
                ListItem() {
                  Text(this.getRecordTitle(r))
                    .fontSize(13)
                    .padding(10)
                    .backgroundColor('#fff')
                    .borderRadius(8)
                    .width('100%')
                    .onClick(() => this.vm.editRecord(r))
                }
                .margin({ top: 6 })
              })
            }
            .layoutWeight(1)

            Button('+ 添加')
              .fontSize(12)
              .height(32)
              .borderRadius(8)
              .backgroundColor('#f1f5f9')
              .fontColor('#64748b')
              .width('100%')
              .margin({ top: 8 })
              .onClick(() => this.vm.openAddForColumn(col))
          }
          .width(200)
          .backgroundColor('#f1f5f9')
          .borderRadius(12)
          .padding(8)
        })
      }
      .padding(16)
    }
    .scrollable(ScrollDirection.Horizontal)
    .scrollBar(BarState.Off)
    .layoutWeight(1)
  }

  // ============ 日历视图 ============
  @Builder
  calendarView() {
    Column() {
      // 月份导航
      Row() {
        Text('<')
          .fontSize(20)
          .onClick(() => this.vm.calPrevMonth())
        Text(`${this.vm.calYear}年${this.vm.calMonth}月`)
          .fontSize(16)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('今天')
          .fontSize(13)
          .fontColor('#4f46e5')
          .onClick(() => this.vm.calToday())
        Text('>')
          .fontSize(20)
          .onClick(() => this.vm.calNextMonth())
      }
      .width('100%')
      .padding(16)

      // 星期头
      Row() {
        ForEach(['一', '二', '三', '四', '五', '六', '日'], d => {
          Text(d).fontSize(12).fontColor('#94a3b8').layoutWeight(1).textAlign(TextAlign.Center)
        })
      }
      .padding({ left: 12, right: 12 })

      // 日历格子
      Grid() {
        ForEach(this.vm.calCells, (cell) => {
          GridItem() {
            Column() {
              Text(String(cell.date.getDate()))
                .fontSize(14)
                .fontColor(cell.isCurrentMonth ? '#1e293b' : '#cbd5e1')
                .fontWeight(cell.isCurrentMonth && this.isToday(cell.date) ? FontWeight.Bold : FontWeight.Normal)
              ForEach(cell.records.slice(0, 2), (r) => {
                Text('●')
                  .fontSize(10)
                  .fontColor('#4f46e5')
              })
              if (cell.records.length > 2) {
                Text(`+${cell.records.length - 2}`)
                  .fontSize(9)
                  .fontColor('#94a3b8')
              }
            }
            .width('100%')
            .height('100%')
            .justifyContent(FlexAlign.Start)
            .alignItems(HorizontalAlign.Center)
            .padding(4)
          }
          .backgroundColor(this.isToday(cell.date) ? '#eef2ff' : '#fff')
          .borderRadius(8)
          .onClick(() => {
            if (cell.records.length > 0) {
              this.vm.editRecord(cell.records[0])
            }
          })
        })
      }
      .columnsTemplate('1fr 1fr 1fr 1fr 1fr 1fr 1fr')
      .rowsTemplate('1fr 1fr 1fr 1fr 1fr 1fr')
      .width('100%')
      .layoutWeight(1)
      .padding({ left: 8, right: 8, top: 8 })
      .backgroundColor('#f8fafc')
    }
  }

  // ============ 图册视图 ============
  @Builder
  galleryView() {
    List() {
      ForEach(this.vm.records, (r) => {
        ListItem() {
          Column() {
            Text(this.getRecordTitle(r))
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .maxLines(2)
              .textOverflow({ overflow: TextOverflow.Ellipsis })

            Text(JSON.stringify(r.data).slice(0, 60))
              .fontSize(12)
              .fontColor('#94a3b8')
              .margin({ top: 6 })
              .maxLines(2)
          }
          .width('100%')
          .padding(16)
          .backgroundColor('#fff')
          .borderRadius(12)
          .margin({ left: 16, right: 16, top: 8 })
          .onClick(() => this.vm.editRecord(r))
        }
      })
    }
    .layoutWeight(1)
    .scrollBar(BarState.Off)
  }

  // ============ 记录编辑弹窗 ============
  @Builder
  recordModal() {
    Stack() {
      Column() {
        Column() {
          Row() {
            Text(this.vm.editingRecord ? '编辑记录' : '新建记录')
              .fontSize(17)
              .fontWeight(FontWeight.Bold)
            Blank()
            Text('×')
              .fontSize(24)
              .fontColor('#94a3b8')
              .onClick(() => this.vm.showModal = false)
          }
          .width('100%')
          .padding(20)

          Scroll() {
            Column({ space: 16 }) {
              ForEach(this.vm.table?.fields || [], (field) => {
                this.fieldInput(field)
              })
            }
            .padding(20)
          }
          .layoutWeight(1)

          Row({ space: 12 }) {
            Button('取消')
              .layoutWeight(1)
              .height(46)
              .borderRadius(12)
              .backgroundColor('#f1f5f9')
              .fontColor('#64748b')
              .onClick(() => this.vm.showModal = false)

            Button(this.vm.saving ? '保存中...' : '保存')
              .layoutWeight(1)
              .height(46)
              .borderRadius(12)
              .backgroundColor('#4f46e5')
              .fontColor('#fff')
              .enabled(!this.vm.saving)
              .onClick(() => this.vm.saveRecord())
          }
          .padding(20)
        }
        .width('100%')
        .height('85%')
        .backgroundColor('#fff')
        .borderRadius({ topLeft: 20, topRight: 20 })
      }
      .width('100%')
      .height('100%')
      .backgroundColor('rgba(0,0,0,0.4)')
      .justifyContent(FlexAlign.End)
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  fieldInput(field: any) {
    Column({ space: 6 }) {
      Text(field.name)
        .fontSize(13)
        .fontColor('#64748b')
        .alignSelf(ItemAlign.Start)

      if (field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') {
        TextInput({ text: this.vm.formData[field.name] || '' })
          .height(44)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onChange(v => this.vm.formData[field.name] = v)
      } else if (field.type === 'number' || field.type === 'currency') {
        TextInput({ text: String(this.vm.formData[field.name] || '') })
          .type(InputType.Number)
          .height(44)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onChange(v => this.vm.formData[field.name] = Number(v))
      } else if (field.type === 'textarea') {
        TextArea({ text: this.vm.formData[field.name] || '' })
          .height(80)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onChange(v => this.vm.formData[field.name] = v)
      } else if (field.type === 'select' && field.options) {
        Select(field.options.map(o => ({ value: o })))
          .value(this.vm.formData[field.name] || '')
          .height(44)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onSelect((_, v) => this.vm.formData[field.name] = field.options[v])
      } else if (field.type === 'date') {
        TextPicker({ range: ['2020-01-01', '2030-12-31'] })
          .height(44)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onChange(v => this.vm.formData[field.name] = v)
      } else if (field.type === 'checkbox' && field.options) {
        Flex({ wrap: FlexWrap.Wrap, space: 8 }) {
          ForEach(field.options, (opt) => {
            Text(opt)
              .fontSize(13)
              .padding({ left: 12, right: 12, top: 6, bottom: 6 })
              .borderRadius(20)
              .backgroundColor((this.vm.formData[field.name] as string[])?.includes(opt) ? '#eef2ff' : '#f1f5f9')
              .fontColor((this.vm.formData[field.name] as string[])?.includes(opt) ? '#4f46e5' : '#64748b')
              .onClick(() => {
                const arr: string[] = this.vm.formData[field.name] || []
                const idx = arr.indexOf(opt)
                if (idx >= 0) arr.splice(idx, 1)
                else arr.push(opt)
                this.vm.formData[field.name] = arr
              })
          })
        }
      } else {
        TextInput({ text: this.vm.formData[field.name] || '' })
          .height(44)
          .borderRadius(10)
          .backgroundColor('#f8fafc')
          .onChange(v => this.vm.formData[field.name] = v)
      }
    }
  }

  getRecordTitle(r: any): string {
    const firstField = this.vm.table?.fields?.[0]
    return firstField ? (r.data[firstField.name] || '(无标题)') : '(无标题)'
  }

  isToday(date: Date): boolean {
    const t = new Date()
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
  }
}
