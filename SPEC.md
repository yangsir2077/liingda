# NoCode Platform - 产品规格说明书

## 1. 产品概述

**产品名称：** 易搭 (YiDa) - 可视化管理系统构建平台

**一句话描述：** 用户通过拖拽配置，无需编程，即可快速搭建自己的管理系统，并一键打包为 HarmonyOS App。

**核心差异化：**
- 可视化表单/数据库设计器
- 多视图支持（表格、看板、日历）
- AI 辅助配置（截图识别生成字段）
- 飞书/微信通知集成
- 一键打包为手机 App

**目标用户：**
- 中小企业主（无技术团队）
- 个体创业者
- 小团队/工作室

**上线截止：** 2026年9月30日前上架华为应用市场

---

## 2. 技术方案

### 架构
```
用户浏览器 ←→ Flask API (REST)
                    ↓
               SQLite DB
                    ↓
            生成的 CRUD API
                    ↓
              Vue3 SPA
                    ↓
           华为 DevEcho 打包 → HarmonyOS App
```

### 后端技术
- **框架：** Flask 3.x (Python)
- **数据库：** SQLite（开发）+ PostgreSQL（生产）
- **ORM：** SQLAlchemy
- **API：** Flask-RESTful
- **认证：** JWT (PyJWT)
- **CORS：** Flask-CORS

### 前端技术
- **框架：** Vue 3 (CDN，方便打包)
- **UI组件：** PrimeVue (MIT)
- **拖拽：** VueDraggable
- **图表：** Chart.js
- **打包：** Vite → web app

### 移动端
- 华为 DevEcho Studio (webview 打包)
- 备选：Capacitor (iOS/Android/HarmonyOS)

---

## 3. 功能模块

### MVP (v0.1 - 4周)
- [ ] 用户注册/登录 (邮箱)
- [ ] 创建应用（workspace）
- [ ] 创建数据表（定义字段：文本/数字/日期/下拉/复选框）
- [ ] 增删改查数据
- [ ] 表格视图展示数据
- [ ] 基础仪表盘（统计卡片）
- [ ] 响应式管理后台（手机可用）

### v0.2 (6-8周)
- [ ] 看板视图
- [ ] 日历视图
- [ ] 表单构建器（拖拽）
- [ ] 权限管理（团队成员）
- [ ] 数据导入导出

### v1.0 (9月底)
- [ ] 工作流自动化
- [ ] 飞书/微信通知
- [ ] AI 辅助配置
- [ ] HarmonyOS App 打包
- [ ] 华为应用市场上架

---

## 4. 数据模型

### User (用户)
- id, email, password_hash, name, created_at

### App (应用)
- id, user_id, name, description, config(json), created_at

### Table (数据表)
- id, app_id, name, slug, fields(json), created_at

### Record (数据记录)
- id, table_id, data(json), created_at, updated_at

### View (视图)
- id, table_id, type(kanban/calendar/grid), config(json)

### Workflow (工作流)
- id, app_id, trigger, actions(json), enabled

---

## 5. API 设计

### 认证
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### 应用管理
- GET /api/apps
- POST /api/apps
- GET /api/apps/<id>
- PUT /api/apps/<id>
- DELETE /api/apps/<id>

### 数据表管理
- GET /api/apps/<id>/tables
- POST /api/apps/<id>/tables
- GET /api/tables/<id>
- PUT /api/tables/<id>
- DELETE /api/tables/<id>

### 数据操作
- GET /api/tables/<id>/records
- POST /api/tables/<id>/records
- GET /api/records/<id>
- PUT /api/records/<id>
- DELETE /api/records/<id>

---

## 6. 目录结构

```
nocode-platform/
├── backend/
│   ├── app.py              # Flask 入口
│   ├── config.py           # 配置
│   ├── models.py           # 数据模型
│   ├── auth.py             # 认证
│   ├── routes/
│   │   ├── apps.py
│   │   ├── tables.py
│   │   └── records.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── router.js
│   │   ├── api.js
│   │   └── views/
│   └── vite.config.js
├── README.md
└── SPEC.md
```

---

*最后更新：2026-04-22*
