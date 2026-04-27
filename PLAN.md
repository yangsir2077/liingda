# 零搭 HarmonyOS App 开发计划

## Goal
将零搭 NoCode 平台重构为原生 HarmonyOS App（ArkTS），保留全部 Web 功能，UI 借鉴经典移动端设计风格。

## Context

### 现有后端 API（已分析）
- `POST/GET /api/auth/login|register|verify-email|send-reset-code|reset-password` — 认证
- `GET/POST /api/apps` — 应用管理
- `GET/PUT/DELETE /api/apps/:id` — 应用 CRUD
- `GET /api/apps/:id/stats` — 应用统计
- `GET/POST /api/apps/:id/tables` — 数据表
- `GET/PUT/DELETE /api/tables/:id` — 数据表 CRUD
- `GET/POST /api/tables/:id/records` — 记录 CRUD
- `POST /api/tables/:id/records/batch` — 批量操作
- `POST /api/tables/:id/import` — CSV 导入
- `GET /api/tables/:id/export` — CSV 导出
- `GET/POST /api/tables/:id/forms` — 公开表单
- `POST /api/public/forms/:key` — 公开表单提交
- `GET /api/users` — 用户管理
- `POST /api/users/batch` — 用户批量操作

### 技术栈
- **语言**: ArkTS（HarmonyOS）
- **HTTP**: `@ohos.net.http`
- **状态管理**: AppStorage + @Link/@StorageLink
- **路由**: HarmonyOS Router（`router.pushUrl`）
- **UI 框架**: ArkUI（ets）

---

## Phases

### Phase 1: 项目骨架搭建
- [x] 创建 HarmonyOS 项目（DevEco Studio）
- [x] 配置 `module.json5` 权限（网络权限ohos.permission.INTERNET）
- [x] 配置网络请求基类（HTTP Client + 拦截器）
- [x] 建立目录结构
- [x] 编写类型定义文件 `types.ets`
- [x] 编写 API 错误处理工具 `Result.ets`

### Phase 2: 认证模块（完整功能）
- [x] `LoginPage` — 登录页（渐变背景、表单验证）
- [x] `RegisterPage` — 注册页（邮箱验证码流程）
- [x] `ForgotPasswordPage` — 忘记密码（发送验证码→重置密码）
- [x] `AuthViewModel` — 认证逻辑（登录/注册/验证码/Token 管理）
- [x] `StorageService` — Token 本地持久化（AppStorage）

- [x] `DashboardPage` — 首页（4个统计卡片 + 应用列表）
- [x] `AppCard` — 应用卡片组件（滑动删除）
- [x] `CreateAppDialog` — 新建应用弹窗（名称+图标+描述）
- [x] `DashboardViewModel` — 数据加载/刷新逻辑

### Phase 4: 应用详情 + 数据表管理
- [x] `AppDetailPage` — 应用详情（数据表列表）
- [x] `TableBuilderDialog` — 可视化建表（字段类型选择器）
- [x] `FieldEditor` — 字段编辑组件（拖拽排序）
- [x] `AppDetailViewModel` — 应用+数据表 CRUD

### Phase 5: 数据管理（核心，4种视图）
- [x] `TableDetailPage` — 数据管理主页
- [x] `TableListView` — 列表视图（搜索+分页+多选）
- [x] `TableKanbanView` — 看板视图（拖拽）
- [x] `TableCalendarView` — 日历视图
- [x] `TableGalleryView` — 图册视图
- [x] `RecordCard` — 记录卡片（操作按钮居中）
- [x] `RecordModal` — 记录新增/编辑弹窗
- [x] `TableDetailViewModel` — 数据操作逻辑

### Phase 6: 公开表单
- [ ] `FormPreviewPage` — 公开表单填写页
- [ ] `FormViewModel` — 表单提交逻辑

### Phase 7: 个人中心 + 用户管理
- [x] `ProfilePage` — 个人中心（修改密码、退出登录）
- [ ] `UserManagementPage` — 用户管理（管理员功能）

### Phase 8: AI 功能（DeepSeek 本地集成）
- [x] `AiService` — 对接 Ollama DeepSeek-Coder（字段推荐/数据分析/文案生成）
- [x] `AiFieldHelper` — 建表时 AI 推荐字段类型（置信度展示）
- [x] `AiDataPanel` — 数据管理 AI 分析面板（趋势/异常洞察）
- [ ] `ConfirmDialog` — 确认弹窗
- [ ] 网络错误处理（断网提示、重试）

---

## 模块目录结构

```
entry/src/main/ets/
├── model/
│   ├── types.ets          # 所有类型定义
│   └── Result.ets          # API 返回结果包装
├── service/
│   ├── HttpClient.ets     # HTTP 请求基类（拦截器）
│   ├── StorageService.ets # Token/本地存储
│   ├── AuthService.ets    # 认证相关 API
│   ├── AppService.ets     # 应用相关 API
│   ├── TableService.ets   # 数据表相关 API
│   ├── RecordService.ets  # 记录相关 API
│   └── FormService.ets    # 表单相关 API
├── viewmodel/
│   ├── AuthViewModel.ets
│   ├── DashboardViewModel.ets
│   ├── AppDetailViewModel.ets
│   ├── TableDetailViewModel.ets
│   └── FormViewModel.ets
├── ui/
│   ├── pages/
│   │   ├── LoginPage.ets
│   │   ├── RegisterPage.ets
│   │   ├── DashboardPage.ets
│   │   ├── AppDetailPage.ets
│   │   ├── TableDetailPage.ets
│   │   ├── ProfilePage.ets
│   │   └── UserManagementPage.ets
│   └── components/
│       ├── AppCard.ets
│       ├── TableCard.ets
│       ├── RecordCard.ets
│       ├── ConfirmDialog.ets
│       ├── ToastDialog.ets
│       ├── LoadingDialog.ets
│       ├── CreateAppDialog.ets
│       ├── TableBuilderDialog.ets
│       └── TabBar.ets
└── util/
    ├── logger.ets
    └── validator.ets
```

---

## Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-27 | 用 ArkTS 不用 JavaScript | 华为应用市场上架要求，性能更好 |
| 2026-04-27 | 直接调用现有 REST API，不新建后端 | 节省工作，零搭后端已完整 |
| 2026-04-27 | UI 风格借鉴 Notion/飞书/Notion Mobile | 经典移动端设计，简洁专业 |

---

## Progress Log

| Date | What changed |
|---|---|
| 2026-04-27 | 开始制定 HarmonyOS App 开发计划 |
| 2026-04-27 | Phase 1 完成：骨架搭建（12个文件） |
| 2026-04-27 | Phase 2 完成：认证模块 |
| 2026-04-27 | Phase 3-5 完成：Dashboard + AppDetail + TableDetail（4视图） |
| 2026-04-27 | Phase 6-8 完成：公开表单 + 用户管理 + AI（DeepSeek集成），共32个文件 |
