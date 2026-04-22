// 零搭 NoCode Platform - Frontend App
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

// API 基础 URL
const API_BASE = 'http://192.168.0.104:5000/api';

// Axios 实例
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lingda_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('lingda_token');
    if (location.hash !== '#login') location.hash = '#login';
  }
  return Promise.reject(err);
});

// Toast
let toastTimeout;
function showToast(msg, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  clearTimeout(toastTimeout);
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  toastTimeout = setTimeout(() => el.remove(), 3000);
}

// ============ 图标选项（清晰表意的Unicode符号） ============
const ICON_OPTIONS = [
  { icon: '▤', label: '文档', bg: '#EEF2FF', color: '#4F46E5' },
  { icon: '⊕', label: '客户', bg: '#E0F2FE', color: '#0891B2' },
  { icon: '≡', label: '数据', bg: '#D1FAE5', color: '#059669' },
  { icon: '◫', label: '项目', bg: '#FEF3C7', color: '#D97706' },
  { icon: '☑', label: '日程', bg: '#F3E8FF', color: '#7C3AED' },
  { icon: '¥', label: '财务', bg: '#FEE2E2', color: '#DC2626' },
  { icon: '◫', label: '库存', bg: '#FFEDD5', color: '#EA580C' },
  { icon: '⚙', label: '行政', bg: '#F1F5F9', color: '#64748B' },
  { icon: '✉', label: '客服', bg: '#FCE7F3', color: '#DB2777' },
  { icon: '✎', label: '培训', bg: '#CCFBF1', color: '#0D9488' },
  { icon: '◁', label: '物流', bg: '#EDE9FE', color: '#9333EA' },
  { icon: '◧', label: '工具', bg: '#E2E8F0', color: '#475569' },
];

// ============ 认证页面 ============
 AuthPage = {
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>零搭</h1>
          <p>可视化管理系统构建平台</p>
        </div>
        <div class="auth-tabs">
          <div class="auth-tab" :class="{active: mode === 'login'}" @click="mode = 'login'">登录</div>
          <div class="auth-tab" :class="{active: mode === 'register'}" @click="mode = 'register'">注册</div>
        </div>
        <form @submit.prevent="submit">
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" v-model="password" placeholder="至少6位" required>
          </div>
          <div class="form-group" v-if="mode === 'register'">
            <label>昵称（选填）</label>
            <input type="text" v-model="name" placeholder="你怎么称呼">
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '处理中...' : (mode === 'login' ? '登录' : '注册') }}
          </button>
        </form>
      </div>
    </div>
  `,
  setup() {
    const mode = ref('login');
    const email = ref('');
    const password = ref('');
    const name = ref('');
    const loading = ref(false);
    async function submit() {
      loading.value = true;
      try {
        const endpoint = mode.value === 'login' ? '/auth/login' : '/auth/register';
        const payload = mode.value === 'login'
          ? { email: email.value, password: password.value }
          : { email: email.value, password: password.value, name: name.value };
        const res = await api.post(endpoint, payload);
        localStorage.setItem('lingda_token', res.data.token);
        location.hash = '#dashboard';
        location.reload();
      } catch (e) {
        showToast(e.response?.data?.error || '操作失败', 'error');
      } finally { loading.value = false; }
    }
    return { mode, email, password, name, loading, submit };
  }
};

// ============ 应用列表 ============
const AppList = {
  template: `
    <div class="page-content">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h2 style="font-size:20px; font-weight:800;">我的应用</h2>
        <button class="btn btn-primary" @click="showCreate = true">
          <i class="pi pi-plus"></i> 新建应用
        </button>
      </div>
      <div class="app-grid">
        <div class="app-card" v-for="app in apps" :key="app.id" @click="openApp(app)">
          <div class="app-card-icon" :style="{ background: ICON_OPTIONS.find(o=>o.icon===app.icon)?.bg || '#EEF2FF', color: ICON_OPTIONS.find(o=>o.icon===app.icon)?.color || '#4F46E5' }">{{ app.icon || '▤' }}</div>
          <button @click.stop="deleteApp(app)" title="删除应用" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;background:#FEE2E2;border:1.5px solid #FECACA;border-radius:50%;cursor:pointer;color:#DC2626;font-size:13px;line-height:20px;text-align:center;font-weight:bold;padding:0;z-index:2">×</button>
          <div class="app-card-name">{{ app.name }}</div>
          <div class="app-card-desc">{{ app.description || '暂无描述' }}</div>
          <div class="app-card-meta">{{ app.table_count }} 个数据表</div>
        </div>
        <div class="new-app-card" @click="showCreate = true">
          <i class="pi pi-plus-circle"></i>
          <span>创建新应用</span>
        </div>
      </div>
      <div class="modal-overlay" v-if="showCreate" @click.self="showCreate = false">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <div class="modal-title">新建应用</div>
            <button class="modal-close" @click="showCreate = false">×</button>
          </div>
          <form @submit.prevent="createApp">
            <div class="form-group">
              <label>应用名称</label>
              <input v-model="newApp.name" placeholder="如：客户管理系统" required autofocus style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
            </div>
            <div class="form-group">
              <label>选择图标</label>
              <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:8px">
                <div v-for="opt in ICON_OPTIONS" :key="opt.icon"
                  @click="pickIcon(opt.icon)"
                  :style="newApp.icon === opt.icon ? 'border-color:' + opt.color + ';background:' + opt.bg : ''"
                  style="padding:10px 6px;border-radius:10px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.15s">
                  <div style="font-size:24px;margin-bottom:2px;color:#333">{{ opt.icon }}</div>
                  <div style="font-size:10px;color:var(--text-secondary)">{{ opt.label }}</div>
                </div>
                <div @click="showIconPicker = true"
                  style="padding:10px 6px;border-radius:10px;border:2px dashed var(--border);cursor:pointer;text-align:center;transition:all 0.15s;color:var(--text-secondary)">
                  <div style="font-size:24px;margin-bottom:2px">✎</div>
                  <div style="font-size:10px">自定义</div>
                </div>
              </div>
              <!-- 选中图标预览 -->
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <span style="font-size:13px;color:var(--text-secondary)">当前：</span>
                <span style="display:inline-block;padding:6px 14px;border-radius:10px;font-size:20px;background:#EEF2FF">{{ newApp.icon || '▤' }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>描述（选填）</label>
              <textarea v-model="newApp.description" placeholder="简单描述..." rows="2" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;resize:none;font-size:15px;outline:none"></textarea>
            </div>
            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
              <button type="button" class="btn btn-secondary" @click="showCreate=false">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="creating">{{ creating ? '创建中...' : '创建应用' }}</button>
            </div>
          </form>
        </div>
      </div>
      <!-- 自定义图标弹窗 -->
      <div class="modal-overlay" v-if="showIconPicker" @click.self="showIconPicker=false">
        <div class="modal" style="max-width:360px">
          <div class="modal-header">
            <div class="modal-title">自定义图标</div>
            <button class="modal-close" @click="showIconPicker=false">×</button>
          </div>
          <div class="form-group">
            <label style="font-weight:600;margin-bottom:8px;display:block">输入任意字符作为图标</label>
            <input v-model="newApp.icon" maxlength="4" placeholder="输入图标字符" style="width:100%;padding:14px;border:1.5px solid var(--border);border-radius:10px;font-size:28px;outline:none;text-align:center;letter-spacing:8px" autofocus @keyup.enter="showIconPicker=false">
            <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);text-align:center">输入任意字符：字母、数字、符号、emoji</div>
          </div>
          <div style="display:flex;justify-content:center;margin-top:16px">
            <button class="btn btn-primary" @click="showIconPicker=false" style="min-width:120px">确定</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const apps = ref([]);
    const showCreate = ref(false);
    const showIconPicker = ref(false);
    const newApp = ref({ name: '', icon: '▤', description: '' });
    const creating = ref(false);
    const ICON_LIST = '▤⊕▊◫☑¥⚙✉✎◁⚡◈⬡✧◎⬢✶☰◆▣◈'.split('');
    async function load() {
      try { const res = await api.get('/apps'); apps.value = res.data; }
      catch (e) { showToast('加载失败', 'error'); }
    }
    function pickIcon(icon) { newApp.value.icon = icon; }
    async function deleteApp(app) {
      if (!confirm(`确定删除应用"${app.name}"？所有数据将被永久删除！`)) return;
      try { await api.delete(`/apps/${app.id}`); apps.value = apps.value.filter(x => x.id !== app.id); showToast('已删除', 'success'); }
      catch (e) { showToast('删除失败', 'error'); }
    }
    function openApp(app) { location.hash = `#app/${app.id}`; }
    async function createApp() {
      if (!newApp.value.name.trim()) return;
      creating.value = true;
      try {
        const res = await api.post('/apps', newApp.value);
        apps.value.unshift(res.data);
        showCreate.value = false;
        newApp.value = { name: '', icon: '▤', description: '' };
        showToast('应用创建成功', 'success');
        openApp(res.data);
      } catch (e) { showToast(e.response?.data?.error || '创建失败', 'error'); }
      finally { creating.value = false; }
    }
    onMounted(load);
    return { apps, showCreate, showIconPicker, newApp, creating, openApp, createApp, pickIcon, ICON_OPTIONS, ICON_LIST };
  }
};

// ============ 应用详情页 ============
const AppDetail = {
  props: ['appId'],
  template: `
    <div class="page-content">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <button class="btn btn-secondary" @click="location.hash='#dashboard'" style="padding:8px 14px;border-radius:10px">
          ←
        </button>
        <div>
          <h2 style="font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px;">
            <span>{{ app.icon }}</span> {{ app.name }}
          </h2>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">{{ app.description || '暂无描述' }}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:10px;">
          <button class="btn btn-secondary" @click="openBuilder">
            <i class="pi pi-plus"></i> 添加数据表
          </button>
        </div>
      </div>

      <!-- 数据表列表 -->
      <div v-if="tables.length">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          <div class="table-item" v-for="t in tables" :key="t.id" @click="openTable(t)" style="cursor:pointer">
            <div style="display:flex;align-items:center;gap:12px;flex:1">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">📊</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:15px;">{{ t.name }}</div>
                <div style="font-size:12px;color:var(--text-secondary);">{{ t.record_count }} 条 · {{ t.fields?.length || 0 }} 个字段</div>
              </div>
            </div>
            <button class="btn btn-secondary" @click.stop="editTable(t)" style="padding:6px 10px;font-size:12px;margin-right:8px">编辑</button>
            <button class="btn btn-secondary" @click.stop="deleteTable(t)" style="padding:6px 10px;font-size:12px;color:var(--danger)">删除</button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div style="font-size:56px;margin-bottom:16px;">🗄️</div>
        <h3>还没有数据表</h3>
        <p>点击上方按钮添加第一个数据表<br>或使用下方的可视化构建器</p>
        <button class="btn btn-primary" @click="openBuilder" style="margin-top:16px">
          <i class="pi pi-wrench"></i> 可视化构建器
        </button>
      </div>

      <!-- 字段构建器弹窗 -->
      <div class="modal-overlay" v-if="showBuilder" @click.self="showBuilder=false">
        <div class="modal" style="max-width:700px">
          <div class="modal-header">
            <div class="modal-title">{{ editingTable ? '编辑数据表' : '新建数据表' }}</div>
            <button class="modal-close" @click="showBuilder=false">×</button>
          </div>
          <div class="form-group">
            <label>数据表名称</label>
            <input v-model="tableForm.name" placeholder="如：客户信息" @input="syncSlug" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <label style="font-weight:600">字段设计</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button v-for="type in fieldTypes" :key="type.value" type="button" @click="addField(type)"
                style="padding:4px 10px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.15s"
                :style="hoverStyle">
                <span>{{ type.icon }}</span> {{ type.label }}
              </button>
            </div>
          </div>
          <!-- 字段列表（可拖拽） -->
          <div class="field-list" style="margin-bottom:16px;min-height:60px">
            <div v-for="(f, i) in tableForm.fields" :key="i"
              style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg);border-radius:10px;margin-bottom:8px;border:1.5px solid var(--border)"
              :style="f.required ? 'border-color:var(--primary)' : ''">
              <span style="color:var(--text-secondary);cursor:grab;font-size:16px">⋮⋮</span>
              <input v-model="f.name" placeholder="字段名称" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:14px;outline:none">
              <div style="padding:4px 10px;background:var(--primary-light);color:var(--primary);border-radius:6px;font-size:12px;font-weight:600;min-width:60px;text-align:center">{{ fieldTypeLabel(f.type) }}</div>
              <button @click="toggleRequired(f)" :style="f.required ? 'color:var(--primary)' : 'color:var(--text-secondary)'" style="background:none;border:none;cursor:pointer;font-size:14px" title="必填">*</button>
              <!-- 下拉选项 -->
              <div v-if="f.type==='select'" style="flex:2;display:flex;flex-wrap:wrap;gap:4px;align-items:center">
                <input v-for="(opt, oi) in (f.options||[])" :key="oi" v-model="f.options[oi]"
                  style="padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;width:70px;outline:none"
                  @blur="ensureOption(f)">
                <button @click="addOption(f)" style="background:none;border:1px dashed var(--border);border-radius:4px;padding:2px 8px;font-size:12px;cursor:pointer;color:var(--text-secondary)">+选项</button>
              </div>
              <button @click="removeField(i)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:16px">×</button>
            </div>
            <div v-if="!tableForm.fields.length" style="text-align:center;padding:24px;color:var(--text-secondary);border:2px dashed var(--border);border-radius:10px;">
              点击上方按钮添加字段
            </div>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary" @click="showBuilder=false">取消</button>
            <button class="btn btn-primary" @click="saveTable" :disabled="saving">{{ saving ? '保存中...' : '保存数据表' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: ['appId'],
  setup(props) {
    const app = ref({});
    const tables = ref([]);
    const showBuilder = ref(false);
    const editingTable = ref(null);
    const tableForm = ref({ name: '', fields: [] });
    const saving = ref(false);
    const hoverStyle = ref('');
    const fieldTypes = [
      { value: 'text', label: '文本', icon: 'T' },
      { value: 'number', label: '数字', icon: '#' },
      { value: 'select', label: '下拉', icon: '▼' },
      { value: 'checkbox', label: '复选', icon: '☑' },
      { value: 'date', label: '日期', icon: '📅' },
      { value: 'textarea', label: '多行', icon: '☰' },
      { value: 'phone', label: '电话', icon: '☎' },
      { value: 'email', label: '邮箱', icon: '@' },
      { value: 'url', label: '链接', icon: '🔗' },
      { value: 'currency', label: '金额', icon: '¥' },
    ];
    async function load() {
      try {
        const res = await api.get(`/apps/${props.appId}`);
        app.value = res.data;
        tables.value = res.data.tables || [];
      } catch (e) { showToast('加载失败', 'error'); }
    }
    function openTable(t) { location.hash = `#app/${props.appId}/table/${t.id}`; }
    function openBuilder() { editingTable.value = null; tableForm.value = { name: '', fields: [{ name: '标题', type: 'text', required: true }] }; showBuilder.value = true; }
    function editTable(t) {
      editingTable.value = t;
      tableForm.value = { name: t.name, fields: JSON.parse(JSON.stringify(t.fields || [])) };
      showBuilder.value = true;
    }
    async function deleteTable(t) {
      if (!confirm(`确定删除数据表"${t.name}"？所有数据将被永久删除！`)) return;
      try { await api.delete(`/tables/${t.id}`); showToast('已删除', 'success'); tables.value = tables.value.filter(x => x.id !== t.id); }
      catch (e) { showToast('删除失败', 'error'); }
    }
    function addField(type) { tableForm.value.fields.push({ name: '', type: type.value, required: false, options: type.value === 'select' ? ['选项1', '选项2'] : [] }); }
    function removeField(i) { tableForm.value.fields.splice(i, 1); }
    function toggleRequired(f) { f.required = !f.required; }
    function fieldTypeLabel(type) { const t = fieldTypes.find(x => x.value === type); return t ? t.label : type; }
    function addOption(f) { if (!f.options) f.options = []; f.options.push(''); }
    function ensureOption(f) { f.options = (f.options || []).filter(Boolean); }
    function syncSlug() {}
    async function saveTable() {
      if (!tableForm.value.name.trim()) { showToast('请输入表名', 'error'); return; }
      if (!tableForm.value.fields.length) { showToast('请至少添加一个字段', 'error'); return; }
      saving.value = true;
      try {
        let res;
        if (editingTable.value) {
          res = await api.put(`/tables/${editingTable.value.id}`, {
            name: tableForm.value.name,
            fields: tableForm.value.fields,
          });
          const idx = tables.value.findIndex(t => t.id === editingTable.value.id);
          if (idx >= 0) tables.value[idx] = { ...tables.value[idx], ...res.data, fields: tableForm.value.fields };
          showToast('更新成功', 'success');
        } else {
          res = await api.post(`/apps/${props.appId}/tables`, {
            name: tableForm.value.name,
            fields: tableForm.value.fields,
          });
          tables.value.push({ ...res.data, fields: tableForm.value.fields, record_count: 0 });
          showToast('数据表创建成功', 'success');
        }
        showBuilder.value = false;
      } catch (e) { showToast(e.response?.data?.error || '保存失败', 'error'); }
      finally { saving.value = false; }
    }
    onMounted(load);
    return { app, tables, showBuilder, editingTable, tableForm, saving, fieldTypes, hoverStyle, openTable, openBuilder, editTable, deleteTable, addField, removeField, toggleRequired, fieldTypeLabel, addOption, ensureOption, syncSlug, saveTable };
  }
};

// ============ 数据表详情 ============
const TableDetail = {
  props: ['appId', 'tableId'],
  template: `
    <div class="page-content">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="btn btn-secondary" @click="location.hash='#app/'+appId" style="padding:8px 14px;">
          ←
        </button>
        <div>
          <h2 style="font-size:18px;font-weight:800;">{{ table.name }}</h2>
          <div style="font-size:13px;color:var(--text-secondary);">{{ table.fields?.length || 0 }} 个字段 · {{ total }} 条记录</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:10px;">
          <button class="btn btn-secondary" @click="location.hash='#app/'+appId">
            <i class="pi pi-wrench"></i> 设计表结构
          </button>
          <button class="btn btn-primary" @click="openAdd">
            <i class="pi pi-plus"></i> 添加记录
          </button>
        </div>
      </div>

      <!-- 搜索 -->
      <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <input v-model="search" @input="debounceSearch" placeholder="搜索..." style="max-width:280px;flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
        <span style="font-size:13px;color:var(--text-secondary)">共 {{ total }} 条</span>
      </div>

      <!-- 表格（桌面） -->
      <div style="background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border);display:none" class="desktop-table">
        <table style="width:100%;border-collapse:collapse;min-width:600px">
          <thead>
            <tr>
              <th v-for="f in table.fields" :key="f.name" style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--border);white-space:nowrap;background:var(--bg)">{{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span></th>
              <th style="padding:12px 16px;width:100px;background:var(--bg);border-bottom:1px solid var(--border)">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in records" :key="r.id" style="transition:background 0.1s">
              <td v-for="f in table.fields" :key="f.name" style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px">
                <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '☑ 是' : '☐ 否' }}</span></template>
                <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 10px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                <template v-else><span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">{{ r.data[f.name] || '—' }}</span></template>
              </td>
              <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <button @click="editRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--primary);font-size:13px;margin-right:8px">编辑</button>
                <button @click="deleteRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px">删除</button>
              </td>
            </tr>
            <tr v-if="!records.length"><td :colspan="(table.fields?.length||1)+1" style="text-align:center;padding:48px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px">📭</div>暂无数据</td></tr>
          </tbody>
        </table>
      </div>
      <!-- 卡片列表（手机） -->
      <div class="record-cards" style="display:none;flex-direction:column;gap:12px">
        <div v-for="r in records" :key="r.id" style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
            <div style="font-size:12px;color:var(--text-secondary)">#{{ r.id }}</div>
            <div style="display:flex;gap:8px">
              <button @click="editRecord(r)" style="background:var(--primary-light);border:none;cursor:pointer;color:var(--primary);font-size:12px;padding:4px 10px;border-radius:6px;font-weight:600">编辑</button>
              <button @click="deleteRecord(r)" style="background:#FEE2E2;border:none;cursor:pointer;color:#DC2626;font-size:12px;padding:4px 10px;border-radius:6px;font-weight:600">删除</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div v-for="f in table.fields" :key="f.name">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px">{{ f.name }}</div>
              <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '☑' : '☐' }} {{ r.data[f.name] ? '是' : '否' }}</span></template>
              <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 8px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
              <template v-else><span style="font-size:14px;font-weight:500">{{ r.data[f.name] || '—' }}</span></template>
            </div>
          </div>
        </div>
        <div v-if="!records.length" style="text-align:center;padding:40px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px">📭</div>暂无数据，点击添加记录开始</div>
      </div>

      <!-- 分页 -->
      <div v-if="pages > 1" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;">
        <button class="btn btn-secondary" :disabled="page<=1" @click="page--;loadRecords()">上一页</button>
        <span style="font-size:14px">第 {{ page }} / {{ pages }} 页</span>
        <button class="btn btn-secondary" :disabled="page>=pages" @click="page++;loadRecords()">下一页</button>
      </div>

      <!-- 添加/编辑记录弹窗 -->
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal" style="max-width:600px">
          <div class="modal-header">
            <div class="modal-title">{{ editingRecord ? '编辑记录' : '添加记录' }}</div>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div style="max-height:60vh;overflow-y:auto;padding-right:4px">
            <div class="form-group" v-for="f in table.fields" :key="f.name">
              <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">{{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span></label>
              <textarea v-if="f.type==='textarea'" v-model="formData[f.name]" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;resize:none;font-size:15px;outline:none"></textarea>
              <input v-else-if="f.type==='checkbox'" type="checkbox" v-model="formData[f.name]" style="width:18px;height:18px">
              <input v-else-if="f.type==='number' || f.type==='currency'" type="number" v-model="formData[f.name]" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              <input v-else-if="f.type==='date'" type="date" v-model="formData[f.name]" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              <input v-else-if="f.type==='email'" type="email" v-model="formData[f.name]" placeholder="email@example.com" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              <input v-else-if="f.type==='phone'" type="tel" v-model="formData[f.name]" placeholder="手机号码" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              <input v-else-if="f.type==='url'" type="url" v-model="formData[f.name]" placeholder="https://" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              <select v-else-if="f.type==='select'" v-model="formData[f.name]" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;background:white">
                <option value="">请选择</option>
                <option v-for="opt in (f.options||[])" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <input v-else type="text" v-model="formData[f.name]" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
            </div>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="saveRecord" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: ['appId', 'tableId'],
  setup(props) {
    const table = ref({ fields: [] });
    const records = ref([]);
    const total = ref(0);
    const pages = ref(1);
    const page = ref(1);
    const search = ref('');
    const showModal = ref(false);
    const editingRecord = ref(null);
    const formData = ref({});
    const saving = ref(false);
    let searchTimer = null;
    function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page.value = 1; loadRecords(); }, 300); }
    async function loadTable() {
      try { const res = await api.get(`/tables/${props.tableId}`); table.value = res.data; }
      catch (e) { showToast('加载失败', 'error'); }
    }
    async function loadRecords() {
      try { const res = await api.get(`/tables/${props.tableId}/records`, { params: { page: page.value, per_page: 20 } });
        records.value = res.data.records; total.value = res.data.total; pages.value = res.data.pages; }
      catch (e) { showToast('加载失败', 'error'); }
    }
    function openAdd() { editingRecord.value = null; formData.value = {}; showModal.value = true; }
    function editRecord(r) { editingRecord.value = r; formData.value = JSON.parse(JSON.stringify(r.data)); showModal.value = true; }
    async function saveRecord() {
      saving.value = true;
      try {
        if (editingRecord.value) {
          await api.put(`/records/${editingRecord.value.id}`, { data: formData.value });
          showToast('更新成功', 'success');
        } else {
          await api.post(`/tables/${props.tableId}/records`, { data: formData.value });
          showToast('添加成功', 'success');
        }
        closeModal(); loadRecords();
      } catch (e) { showToast(e.response?.data?.error || '保存失败', 'error'); }
      finally { saving.value = false; }
    }
    async function deleteRecord(r) {
      if (!confirm('确认删除这条记录？')) return;
      try { await api.delete(`/records/${r.id}`); showToast('已删除', 'success'); loadRecords(); }
      catch (e) { showToast('删除失败', 'error'); }
    }
    function closeModal() { showModal.value = false; editingRecord.value = null; formData.value = {}; }
    watch(() => props.tableId, () => { loadTable(); loadRecords(); }, { immediate: true });
    return { table, records, total, pages, page, search, showModal, editingRecord, formData, saving, debounceSearch, openAdd, editRecord, saveRecord, deleteRecord, closeModal, loadRecords };
  }
};

// ============ 主应用 ============
const App = {
  setup() {
    const route = ref(location.hash.slice(1) || 'dashboard');
    function parseRoute(h) {
      const parts = h.split('/').filter(Boolean);
      if (parts[0] === 'login') return 'login';
      if (parts[0] === 'app') {
        if (parts[2] === 'table') return { view: 'table', appId: parts[1], tableId: parts[3] };
        return { view: 'app', appId: parts[1] };
      }
      return parts[0] || 'dashboard';
    }
    async function checkAuth() {
      const token = localStorage.getItem('lingda_token');
      if (!token) { route.value = 'login'; return; }
      try {
        await api.get('/auth/me');
        route.value = parseRoute(location.hash.slice(1) || 'dashboard');
        if (route.value === 'login') route.value = 'dashboard';
      } catch { localStorage.removeItem('lingda_token'); route.value = 'login'; }
    }
    function navigate() { route.value = parseRoute(location.hash.slice(1) || 'dashboard'); }
    function logout() { localStorage.removeItem('lingda_token'); location.hash = '#login'; location.reload(); }
    onMounted(async () => { await checkAuth(); window.addEventListener('hashchange', navigate); });
    const currentView = computed(() => typeof route.value === 'string' ? route.value : (route.value?.view || null));
    const routeParams = computed(() => typeof route.value === 'object' ? route.value : null);
    return { view: route, currentView, routeParams, logout };
  },
  template: `
    <auth-page v-if="view==='login'" />
    <div v-else class="admin-layout">
      <div class="sidebar">
        <div class="sidebar-logo">
          <h2>零搭</h2>
          <span>NoCode 平台</span>
        </div>
        <div class="sidebar-nav">
          <div class="sidebar-item" :class="{active: currentView==='dashboard'}" @click="location.hash='#dashboard'">
            <i class="pi pi-th-large"></i> 我的应用
          </div>
          <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
            <div class="sidebar-item" @click="logout" style="color:var(--danger)">
              <i class="pi pi-sign-out"></i> 退出登录
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">{{ currentView === 'app' ? '应用详情' : currentView === 'table' ? '数据管理' : '我的应用' }}</div>
        </div>
        <app-list v-if="currentView==='dashboard'" />
        <app-detail v-else-if="currentView==='app'" :appId="routeParams?.appId" :key="'app-'+routeParams?.appId" />
        <table-detail v-else-if="currentView==='table'" :appId="routeParams?.appId" :tableId="routeParams?.tableId" :key="'table-'+routeParams?.tableId" />
      </div>
      <!-- 手机底部导航 -->
      <nav class="mobile-nav">
        <div class="mobile-nav-item" :class="{active: currentView==='dashboard'}" @click="location.hash='#dashboard'">
          <i class="pi pi-th-large"></i>
          <span>应用</span>
        </div>
        <div class="mobile-nav-item" v-if="currentView!=='dashboard'" @click="location.hash='#app/'+(routeParams?.appId||'')">
          <i class="pi pi-sitemap"></i>
          <span>数据表</span>
        </div>
        <div class="mobile-nav-item" @click="logout">
          <i class="pi pi-sign-out"></i>
          <span>退出</span>
        </div>
      </nav>
    </div>
  `,
  components: { AuthPage, AppList, AppDetail, TableDetail }
};

const app = createApp(App);
app.mount('#app');
