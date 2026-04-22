# 易搭 (YiDa) - 可视化管理系统构建平台

> 一行命令，快速搭建自己的管理系统，并打包为手机 App。

## 🚀 快速启动

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动服务
```bash
python3 server.py
```

然后打开浏览器访问：
- **前端界面**：http://localhost:3000
- **后端 API**：http://localhost:5000

### 3. 注册账号，开始使用

---

## 功能概览

### ✅ 已完成 (MVP)
- [x] 用户注册 / 登录
- [x] 创建应用（多应用管理）
- [x] 创建数据表（自定义字段）
- [x] 支持字段类型：文本、数字、下拉选择、复选框、日期、多行文本
- [x] 增删改查数据记录
- [x] 表格视图展示
- [x] 分页
- [x] 响应式设计（手机可用）

### 🔄 开发中
- [ ] 看板视图
- [ ] 日历视图
- [ ] 拖拽表单构建器
- [ ] 工作流自动化
- [ ] 仪表盘/图表
- [ ] AI 辅助配置

### 📋 计划中
- [ ] HarmonyOS App 打包
- [ ] 华为应用市场上架
- [ ] 团队协作/权限管理
- [ ] 飞书/微信通知

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Flask + SQLAlchemy + JWT |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| 前端 | Vue 3 + PrimeVue |
| 移动端 | Capacitor / 华为 DevEcho Studio |

---

## API 文档

### 认证
```
POST /api/auth/register   # 注册
POST /api/auth/login      # 登录
GET  /api/auth/me         # 当前用户
```

### 应用
```
GET    /api/apps           # 应用列表
POST   /api/apps           # 创建应用
GET    /api/apps/<id>      # 应用详情
PUT    /api/apps/<id>      # 更新应用
DELETE /api/apps/<id>      # 删除应用
```

### 数据表
```
GET    /api/apps/<app_id>/tables    # 表列表
POST   /api/apps/<app_id>/tables    # 创建表
GET    /api/tables/<id>             # 表详情
PUT    /api/tables/<id>             # 更新表
DELETE /api/tables/<id>             # 删除表
```

### 数据记录
```
GET    /api/tables/<id>/records    # 记录列表
POST   /api/tables/<id>/records    # 创建记录
GET    /api/records/<id>           # 记录详情
PUT    /api/records/<id>           # 更新记录
DELETE /api/records/<id>           # 删除记录
```

---

## 项目结构

```
nocode-platform/
├── backend/
│   ├── app.py          # Flask 入口
│   ├── server.py       # 合并启动脚本
│   ├── config.py       # 配置
│   ├── models.py       # 数据模型
│   ├── requirements.txt
│   └── routes/
│       ├── apps.py     # 应用管理 API
│       ├── tables.py    # 数据表 API
│       └── records.py   # 记录 API
├── frontend/
│   ├── index.html      # 主页面
│   ├── app.js          # Vue 前端逻辑
│   └── manifest.json    # PWA 配置
├── SPEC.md              # 完整规格说明
└── README.md
```

---

## 部署到生产环境

```bash
# 使用 gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

*最后更新：2026-04-22 | v0.1 MVP*
