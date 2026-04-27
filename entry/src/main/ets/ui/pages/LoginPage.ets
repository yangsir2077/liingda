/**
 * 登录页
 * 渐变背景 + 表单验证 + 模式切换（登录/注册/忘记密码）
 */
import { AuthViewModel, AuthMode } from '../viewmodel/AuthViewModel'
import { Validator } from '../util/validator'

@Entry
@Component
struct LoginPage {
  @State vm: AuthViewModel = new AuthViewModel()

  build() {
    Stack({ alignContent: Alignment.Top }) {
      // 渐变背景
      Column() {
        LinearGradient({
          angle: 135,
          colors: [['#667eea', 0], ['#764ba2', 0.5], ['#f093fb', 1]]
        })
          .width('100%')
          .height('100%')
      }

      // 表单内容
      Column() {
        // Logo
        Column() {
          Text('零搭')
            .fontSize(40)
            .fontWeight(FontWeight.Bold)
            .fontColor('#fff')
          Text('可视化管理系统构建平台')
            .fontSize(14)
            .fontColor('rgba(255,255,255,0.8)')
            .margin({ top: 8 })
        }
        .margin({ top: 80, bottom: 40 })

        // 表单卡片
        Column() {
          // 模式 Tab
          Row() {
            this.tabItem('登录', 'login', this.vm.mode === 'login')
            this.tabItem('注册', 'register', this.vm.mode === 'register')
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
          .gap(24)
          .margin({ bottom: 24 })

          // 邮箱
          Column({ space: 8 }) {
            Text('邮箱')
              .fontSize(13)
              .fontColor('#64748b')
              .alignSelf(ItemAlign.Start)
            TextInput({ placeholder: 'your@email.com', text: this.vm.email })
              .type(InputType.Email)
              .onChange(v => this.vm.email = v)
              .height(48)
              .borderRadius(12)
              .backgroundColor('#f8fafc')
          }

          // 密码
          if (this.vm.mode === 'login' || this.vm.mode === 'register') {
            Column({ space: 8 }) {
              Text('密码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '至少6位', text: this.vm.password })
                .type(InputType.Password)
                .onChange(v => this.vm.password = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
            }
          }

          // 注册专属：昵称 + 确认密码
          if (this.vm.mode === 'register') {
            Column({ space: 8 }) {
              Text('昵称（选填）')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '你怎么称呼', text: this.vm.name })
                .onChange(v => this.vm.name = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
            }

            Column({ space: 8 }) {
              Text('确认密码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '再输一次', text: this.vm.confirmPassword })
                .type(InputType.Password)
                .onChange(v => this.vm.confirmPassword = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
            }
          }

          // 忘记密码模式
          if (this.vm.mode === 'forgot') {
            Column({ space: 8 }) {
              Text('输入注册邮箱，我们会发送验证码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
            }
          }

          // 重置密码模式
          if (this.vm.mode === 'reset') {
            Column({ space: 8 }) {
              Text('验证码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '请输入6位验证码', text: this.vm.verifyCode })
                .onChange(v => this.vm.verifyCode = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
                .style(TextInputStyle.Inline)
            }

            Column({ space: 8 }) {
              Text('新密码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '至少6位', text: this.vm.newPassword })
                .type(InputType.Password)
                .onChange(v => this.vm.newPassword = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
            }

            Column({ space: 8 }) {
              Text('确认新密码')
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '再输一次', text: this.vm.confirmPassword })
                .type(InputType.Password)
                .onChange(v => this.vm.confirmPassword = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
            }
          }

          // 验证码模式
          if (this.vm.mode === 'verify') {
            Column({ space: 8 }) {
              Text(`验证码已发送到 ${this.vm.verifyEmail}`)
                .fontSize(13)
                .fontColor('#64748b')
                .alignSelf(ItemAlign.Start)
              TextInput({ placeholder: '请输入6位验证码', text: this.vm.verifyCode })
                .onChange(v => this.vm.verifyCode = v)
                .height(48)
                .borderRadius(12)
                .backgroundColor('#f8fafc')
                .style(TextInputStyle.Inline)
            }
          }

          // 提交按钮
          Button(this.submitText)
            .width('100%')
            .height(50)
            .borderRadius(12)
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#fff')
            .backgroundColor('#4f46e5')
            .margin({ top: 16 })
            .enabled(!this.vm.loading)
            .onClick(() => this.handleSubmit())

          // 忘记密码链接
          if (this.vm.mode === 'login' && !this.vm.loading) {
            Text('忘记密码？')
              .fontSize(13)
              .fontColor('#4f46e5')
              .margin({ top: 12 })
              .onClick(() => this.vm.switchMode('forgot'))
          }

          // 返回登录
          if (this.vm.mode === 'register' || this.vm.mode === 'forgot' || this.vm.mode === 'reset') {
            Text('返回登录')
              .fontSize(13)
              .fontColor('#4f46e5')
              .margin({ top: 12 })
              .onClick(() => this.vm.switchMode('login'))
          }

          // 返回注册
          if (this.vm.mode === 'verify') {
            Text('返回注册')
              .fontSize(13)
              .fontColor('#4f46e5')
              .margin({ top: 12 })
              .onClick(() => this.vm.switchMode('register'))
          }
        }
        .padding(28)
        .width('100%')
        .backgroundColor('#fff')
        .borderRadius(24)
        .shadow({
          radius: 24,
          color: 'rgba(0,0,0,0.12)',
          offsetX: 0,
          offsetY: 8
        })
      }
      .padding({ left: 24, right: 24 })
      .width('100%')
      .layoutWeight(1)
      .justifyContent(FlexAlign.Center)
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  tabItem(title: string, mode: AuthMode, active: boolean) {
    Column() {
      Text(title)
        .fontSize(16)
        .fontWeight(active ? FontWeight.Bold : FontWeight.Normal)
        .fontColor(active ? '#4f46e5' : '#94a3b8')
      Blank(4)
        .backgroundColor(active ? '#4f46e5' : 'transparent')
        .width(active ? 24 : 0)
        .height(3)
        .borderRadius(2)
    }
    .onClick(() => this.vm.switchMode(mode))
  }

  get submitText(): string {
    if (this.vm.loading) return '处理中...'
    switch (this.vm.mode) {
      case 'login': return '登录'
      case 'register': return '注册'
      case 'verify': return '验证邮箱'
      case 'forgot': return '发送验证码'
      case 'reset': return '重置密码'
    }
  }

  async handleSubmit(): Promise<void> {
    switch (this.vm.mode) {
      case 'login': this.vm.login(); break
      case 'register': this.vm.register(); break
      case 'verify': this.vm.verifyEmailCode(); break
      case 'forgot': this.vm.sendResetCode(); break
      case 'reset': this.vm.resetPassword(); break
    }
  }
}
