/**
 * 公开表单填写页
 */
import { FormViewModel } from '../viewmodel/FormViewModel'
import { aiService } from '../service/AiService'
import { showToast } from '../util/toast'

@Entry
@Component
struct FormPreviewPage {
  @State vm: FormViewModel = new FormViewModel()
  @State aiInsight: string = ''
  @State showAi: boolean = false

  async aboutToAppear() {
    await this.vm.load()
  }

  build() {
    Column() {
      // 顶部
      Row() {
        Text('<')
          .fontSize(22)
          .onClick(() => router.back())
        Text(this.vm.form?.name || '公开表单')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .margin({ left: 8 })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor('#fff')

      if (this.vm.loading) {
        Column() {
          LoadingProgress().width(40).height(40)
          Text('加载中...').fontSize(14).fontColor('#94a3b8').margin({ top: 12 })
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else if (this.vm.errorMsg) {
        Column() {
          Text('⚠️')
            .fontSize(48)
          Text(this.vm.errorMsg)
            .fontSize(15)
            .fontColor('#dc2626')
            .margin({ top: 12 })
          Text('请联系表单创建者确认链接是否正确')
            .fontSize(13)
            .fontColor('#94a3b8')
            .margin({ top: 8 })
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else if (this.vm.submitted) {
        Column() {
          Text('✅')
            .fontSize(56)
          Text(this.vm.successMessage || '提交成功！')
            .fontSize(17)
            .fontWeight(FontWeight.Bold)
            .margin({ top: 16 })
          Text('数据已提交，感谢您的填写')
            .fontSize(14)
            .fontColor('#94a3b8')
            .margin({ top: 8 })
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else {
        Scroll() {
          Column({ space: 16 }) {
            // 表单信息
            if (this.vm.form?.description) {
              Text(this.vm.form.description)
                .fontSize(14)
                .fontColor('#64748b')
                .width('100%')
                .padding(16)
                .backgroundColor('#f8fafc')
                .borderRadius(12)
            }

            // 字段输入
            ForEach(this.vm.fields, (field) => {
              this.formField(field)
            })

            if (this.vm.errorMsg) {
              Text(this.vm.errorMsg)
                .fontSize(13)
                .fontColor('#dc2626')
            }

            Button(this.vm.submitting ? '提交中...' : '立即提交')
              .width('100%')
              .height(50)
              .borderRadius(12)
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor('#fff')
              .backgroundColor('#4f46e5')
              .enabled(!this.vm.submitting)
              .onClick(() => this.vm.submitForm())
          }
          .padding(20)
        }
        .layoutWeight(1)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f8fafc')
  }

  @Builder
  formField(field: any) {
    Column({ space: 6 }) {
      Row() {
        Text(field.name)
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
        if (field.required) {
          Text('*').fontColor('#dc2626').margin({ left: 4 })
        }
      }
      .width('100%')
      .alignSelf(ItemAlign.Start)

      if (field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') {
        TextInput({ placeholder: `请输入${field.name}`, text: this.vm.formValues[field.name] || '' })
          .height(48)
          .borderRadius(12)
          .backgroundColor('#fff')
          .onChange(v => this.vm.formValues[field.name] = v)
      } else if (field.type === 'number') {
        TextInput({ placeholder: `请输入${field.name}`, text: String(this.vm.formValues[field.name] || '') })
          .type(InputType.Number)
          .height(48)
          .borderRadius(12)
          .backgroundColor('#fff')
          .onChange(v => this.vm.formValues[field.name] = Number(v))
      } else if (field.type === 'textarea') {
        TextArea({ placeholder: `请输入${field.name}`, text: this.vm.formValues[field.name] || '' })
          .height(88)
          .borderRadius(12)
          .backgroundColor('#fff')
          .onChange(v => this.vm.formValues[field.name] = v)
      } else if (field.type === 'select' && field.options) {
        Select(field.options.map(o => ({ value: o })))
          .value(this.vm.formValues[field.name] || '')
          .height(48)
          .borderRadius(12)
          .backgroundColor('#fff')
          .onSelect((_, v) => this.vm.formValues[field.name] = field.options[v])
      } else if (field.type === 'checkbox' && field.options) {
        Flex({ wrap: FlexWrap.Wrap, space: 8 }) {
          ForEach(field.options, (opt) => {
            Text(opt)
              .fontSize(13)
              .padding({ left: 12, right: 12, top: 6, bottom: 6 })
              .borderRadius(20)
              .backgroundColor((this.vm.formValues[field.name] as string[])?.includes(opt) ? '#eef2ff' : '#fff')
              .fontColor((this.vm.formValues[field.name] as string[])?.includes(opt) ? '#4f46e5' : '#64748b')
              .border({ width: 1, color: (this.vm.formValues[field.name] as string[])?.includes(opt) ? '#4f46e5' : '#e2e8f0' })
              .onClick(() => {
                const arr: string[] = this.vm.formValues[field.name] || []
                const idx = arr.indexOf(opt)
                if (idx >= 0) arr.splice(idx, 1)
                else arr.push(opt)
                this.vm.formValues[field.name] = arr
              })
          })
        }
      } else if (field.type === 'date') {
        TextPicker({ range: ['2020-01-01', '2030-12-31'] })
          .height(48)
          .borderRadius(12)
          .backgroundColor('#fff')
          .onChange(v => this.vm.formValues[field.name] = v)
      }
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#fff')
    .borderRadius(12)
  }
}

import router from '@ohos.router'
