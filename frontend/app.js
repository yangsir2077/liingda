// 零搭 NoCode Platform - Frontend App
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

// API 基础 URL
const API_BASE = '/api';

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
      <!-- 无遮罩层，靠点击卡片本身收回 -->
      <div class="app-grid">
        <div v-for="app in apps" :key="app.id" style="position:relative;overflow:hidden;border-radius:12px;margin-bottom:12px">
          <!-- 删除区域（滑开才显示） -->
          <div v-if="swipedId === app.id"
            @click="swipedId = null"
            style="position:absolute;top:0;right:0;bottom:0;width:80px;background:#DC2626;display:flex;align-items:center;justify-content:center;z-index:0;border-radius:12px">
            <button @click.stop="deleteApp(app)"
              style="background:none;border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4">
              删<br>除
            </button>
          </div>
          <!-- 卡片主体 -->
          <div class="app-card"
            @touchstart="onTouchStart($event, app.id)"
            @touchmove="onTouchMove($event, app.id)"
            @touchend="onTouchEnd($event, app.id)"
            @click="handleCardClick(app)"
            :style="{ transform: swipedId === app.id ? 'translateX(-80px)' : 'translateX(0)', transition: transitioning ? 'transform 0.3s' : 'none', position:'relative',zIndex:1 }">
            <div class="app-card-icon" :style="{ background: ICON_OPTIONS.find(o=>o.icon===app.icon)?.bg || '#EEF2FF', color: ICON_OPTIONS.find(o=>o.icon===app.icon)?.color || '#4F46E5' }">{{ app.icon || '▤' }}</div>
            <div class="app-card-name">{{ app.name }}</div>
            <div class="app-card-desc">{{ app.description || '暂无描述' }}</div>
            <div class="app-card-meta">{{ app.table_count }} 个数据表</div>
          </div>
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
    const swipedId = ref(null);
    const transitioning = ref(false);
    let touchStartX = 0;
    let touchStartY = 0;
    let didSwipe = false;
    let clickBlocked = false;
    function handleCardClick(app) {
      if (clickBlocked) { clickBlocked = false; return; }
      swipedId.value = null;
      openApp(app);
    }
    function onTouchStart(e, id) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      didSwipe = false;
      transitioning.value = false;
    }
    function onTouchMove(e, id) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!didSwipe) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          didSwipe = true;
        }
      }
      if (didSwipe) {
        e.preventDefault();
        const card = e.currentTarget;
        card.style.transform = `translateX(${Math.max(-80, dx)}px)`;
        if (swipedId.value !== id) swipedId.value = id;
      }
    }
    function onTouchEnd(e, id) {
      transitioning.value = true;
      const card = e.currentTarget;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (!didSwipe) {
        // 轻触 -> 让click事件自然触发
        swipedId.value = null;
        card.style.transform = '';
      } else {
        // 滑动结束 -> 吸附，并阻止click
        clickBlocked = true;
        if (dx < -40) {
          card.style.transform = 'translateX(-80px)';
          swipedId.value = id;
        } else {
          card.style.transform = '';
          swipedId.value = null;
        }
      }
    }
    async function load() {
      try { const res = await api.get('/apps'); apps.value = res.data; }
      catch (e) { showToast('加载失败', 'error'); }
    }
    function pickIcon(icon) { newApp.value.icon = icon; }
    function goBack() { history.back(); }
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
    return { apps, showCreate, showIconPicker, newApp, creating, openApp, createApp, pickIcon, ICON_OPTIONS, ICON_LIST, swipedId, transitioning, onTouchStart, onTouchMove, onTouchEnd };
  }
};

// ============ 应用详情页 ============
const AppDetail = {
  props: ['appId'],
  template: `
    <div class="page-content">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <button class="btn btn-secondary" @click="goBack" style="padding:8px 14px;border-radius:10px">
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
    function goBack() { history.back(); }
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
    return { app, tables, showBuilder, editingTable, tableForm, saving, fieldTypes, hoverStyle, openTable, openBuilder, editTable, deleteTable, addField, removeField, toggleRequired, fieldTypeLabel, addOption, ensureOption, syncSlug, saveTable, goBack };
  }
};

// ============ 数据表详情 ============
// ============ 数据表详情（合并版：视图切换+看板+日历+导入导出+表单管理） ============
const TableDetail = {
  props: ['appId', 'tableId'],
  template: `
    <div class="page-content">
      <!-- 顶部栏 -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-secondary" @click="goBack" style="padding:8px 14px;border-radius:10px">←</button>
        <div style="flex:1;min-width:0">
          <h2 style="font-size:18px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ table.name || '加载中...' }}</h2>
          <div style="font-size:13px;color:var(--text-secondary)">{{ table.fields?.length || 0 }} 个字段 · {{ total }} 条记录</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary" @click="showFormsPanel=true" style="padding:8px 12px;font-size:13px" title="表单管理">📋 表单</button>
          <button class="btn btn-secondary" @click="showImport=true" style="padding:8px 12px;font-size:13px" title="导入CSV">⬆ 导入</button>
          <button class="btn btn-secondary" @click="exportCSV" style="padding:8px 12px;font-size:13px" title="导出CSV">⬇ 导出</button>
          <button class="btn btn-secondary" @click="location.hash='#app/'+appId" style="padding:8px 12px;font-size:13px">⚙ 设计</button>
          <button class="btn btn-primary" @click="openAdd" style="padding:8px 16px;font-size:14px">+ 添加</button>
        </div>
      </div>

      <!-- 视图切换 tabs -->
      <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0">
        <button @click="switchView('table')" :style="viewMode==='table' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s">📊 表格</button>
        <button v-if="kanbanFields.length" @click="switchView('kanban')" :style="viewMode==='kanban' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s">⊟ 看板</button>
        <button v-if="calDateFields.length" @click="switchView('calendar')" :style="viewMode==='calendar' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s">📅 日历</button>
      </div>

      <!-- 搜索栏（仅表格视图） -->
      <div v-if="viewMode==='table'" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <input v-model="search" @input="debounceSearch" placeholder="搜索记录..." style="max-width:300px;flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
        <span style="font-size:13px;color:var(--text-secondary)">共 {{ total }} 条</span>
      </div>

      <!-- ======= 表格视图 ======= -->
      <div v-if="viewMode==='table'">
        <!-- 桌面表格 -->
        <div class="desktop-table" style="background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border)">
          <table style="width:100%;border-collapse:collapse;min-width:500px">
            <thead>
              <tr>
                <th v-for="f in table.fields" :key="f.name" style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--border);white-space:nowrap;background:var(--bg)">{{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span></th>
                <th style="padding:12px 16px;width:110px;background:var(--bg);border-bottom:1px solid var(--border)">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!records.length"><td :colspan="(table.fields?.length||1)+1" style="text-align:center;padding:48px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px">📭</div>暂无数据</td></tr>
              <tr v-for="r in records" :key="r.id" style="transition:background 0.1s;cursor:pointer" @click="viewRecord(r)">
                <td v-for="f in table.fields" :key="f.name" style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px">
                  <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '☑' : '☐' }} {{ r.data[f.name] ? '是' : '否' }}</span></template>
                  <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 10px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                  <template v-else><span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">{{ r.data[f.name] || '—' }}</span></template>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid var(--border)" @click.stop>
                  <button @click="editRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--primary);font-size:13px;margin-right:6px">编辑</button>
                  <button @click="deleteRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 手机卡片 -->
        <div class="record-cards" style="display:none;flex-direction:column;gap:12px">
          <div v-for="r in records" :key="r.id" style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div style="font-size:12px;color:var(--text-secondary)">#{{ r.id }}</div>
              <div style="display:flex;gap:6px" @click.stop>
                <button @click="editRecord(r)" style="background:var(--primary-light);border:none;cursor:pointer;color:var(--primary);font-size:12px;padding:4px 10px;border-radius:6px;font-weight:600">编辑</button>
                <button @click="deleteRecord(r)" style="background:#FEE2E2;border:none;cursor:pointer;color:#DC2626;font-size:12px;padding:4px 10px;border-radius:6px;font-weight:600">删除</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div v-for="f in table.fields" :key="f.name">
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px">{{ f.name }}</div>
                <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '☑' : '☐' }}</span></template>
                <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 8px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                <template v-else><span style="font-size:14px;font-weight:500">{{ r.data[f.name] || '—' }}</span></template>
              </div>
            </div>
          </div>
          <div v-if="!records.length" style="text-align:center;padding:40px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px">📭</div>暂无数据</div>
        </div>
        <!-- 分页 -->
        <div v-if="pages>1" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px">
          <button class="btn btn-secondary" :disabled="page<=1" @click="page--;loadRecords()">‹ 上一页</button>
          <span style="font-size:14px;color:var(--text-secondary)">第 {{ page }} / {{ pages }} 页</span>
          <button class="btn btn-secondary" :disabled="page>=pages" @click="page++;loadRecords()">下一页 ›</button>
        </div>
      </div>

      <!-- ======= 看板视图 ======= -->
      <div v-if="viewMode==='kanban'">
        <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <span style="font-size:14px;color:var(--text-secondary)">按</span>
          <select v-model="kanbanGroupBy" @change="loadKanban" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:white">
            <option value="">请选择分组字段</option>
            <option v-for="f in kanbanFields" :key="f.name" :value="f.name">{{ f.name }}</option>
          </select>
          <span style="font-size:13px;color:var(--text-secondary)">共 {{ total }} 条</span>
        </div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:16px;align-items:flex-start">
          <div v-for="col in kanbanColumns" :key="col.value"
            @dragover.prevent="kanbanDragOver(col.value)"
            @dragleave="kanbanDragLeave"
            @drop.prevent="kanbanDrop(col.value)"
            :style="dragOverColumn===col.value ? 'border-color:'+col.color+';background:'+col.color+'18' : ''"
            style="min-width:240px;max-width:280px;flex:1;background:var(--bg);border-radius:12px;border:2px solid var(--border);padding:12px;transition:all 0.15s">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:8px">
                <div :style="'width:10px;height:10px;border-radius:50%;background:'+col.color"></div>
                <span style="font-weight:700;font-size:14px">{{ col.value || '(空)' }}</span>
              </div>
              <span style="font-size:12px;color:var(--text-secondary);background:var(--surface);padding:2px 8px;border-radius:10px">{{ col.records.length }}</span>
            </div>
            <div v-for="r in col.records" :key="r.id"
              draggable="true"
              @dragstart="kanbanDragStart(r)"
              :style="draggingId===r.id ? 'opacity:0.4' : ''"
              style="background:var(--surface);border-radius:8px;padding:10px 12px;margin-bottom:8px;border:1px solid var(--border);cursor:grab;font-size:13px;line-height:1.5">
              <div style="font-weight:600;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ getRecordTitle(r) }}</div>
              <div style="display:flex;gap:6px;justify-content:flex-end">
                <button @click="editRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--primary);font-size:12px;padding:2px 6px">编辑</button>
                <button @click="deleteRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:12px;padding:2px 6px">删除</button>
              </div>
            </div>
            <button @click="openAddForColumn(col.value)" style="width:100%;padding:8px;background:none;border:1.5px dashed var(--border);border-radius:8px;cursor:pointer;color:var(--text-secondary);font-size:13px;transition:all 0.15s"
              @mouseover="$event.target.style.borderColor='var(--primary)';$event.target.style.color='var(--primary)'"
              @mouseout="$event.target.style.borderColor='var(--border)';$event.target.style.color='var(--text-secondary)'">+ 添加到</button>
          </div>
        </div>
      </div>

      <!-- ======= 日历视图 ======= -->
      <div v-if="viewMode==='calendar'">
        <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <span style="font-size:14px;color:var(--text-secondary)">日期字段：</span>
          <select v-model="calDateField" @change="loadCalendar" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:white">
            <option value="">请选择日期字段</option>
            <option v-for="f in calDateFields" :key="f.name" :value="f.name">{{ f.name }}</option>
          </select>
          <div style="display:flex;gap:8px;margin-left:auto">
            <button @click="calPrevMonth" class="btn btn-secondary" style="padding:6px 12px">‹</button>
            <button @click="calToday" class="btn btn-secondary" style="padding:6px 12px;font-size:13px">今天</button>
            <button @click="calNextMonth" class="btn btn-secondary" style="padding:6px 12px">›</button>
            <span style="font-size:14px;font-weight:600;padding:6px 12px">{{ calYear }}年 {{ calMonth+1 }}月</span>
          </div>
        </div>
        <!-- 星期头 -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
          <div v-for="d in ['一','二','三','四','五','六','日']" :key="d" style="text-align:center;font-size:12px;font-weight:700;color:var(--text-secondary);padding:6px 0">{{ d }}</div>
        </div>
        <!-- 日期格 -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
          <div v-for="(cell,idx) in calCells" :key="idx"
            :style="cell.isToday ? 'border-color:var(--primary);background:var(--primary-light)' : cell.isOtherMonth ? 'opacity:0.4' : 'background:var(--surface)'"
            style="min-height:80px;padding:8px;border-radius:8px;border:1px solid var(--border);font-size:13px;transition:all 0.15s">
            <div style="font-weight:600;margin-bottom:4px" :style="cell.isToday ? 'color:var(--primary)' : ''">{{ cell.day }}</div>
            <div v-for="ev in (cell.events||[]).slice(0,3)" :key="ev.id"
              @click="editRecord(ev)"
              :style="'background:'+ev._color+'20;border-left:3px solid '+ev._color+';color:var(--text);margin-bottom:2px'"
              style="padding:2px 6px;border-radius:4px;font-size:11px;overflow:hidden;text-overflow:ell;white-space:nowrap;cursor:pointer">
              {{ ev._label }}
            </div>
            <div v-if="(cell.events||[]).length > 3" style="font-size:11px;color:var(--text-secondary);padding:2px 6px">+{{ cell.events.length-3 }} 更多</div>
            <button v-if="cell.dateStr" @click="openAddForDate(cell.dateStr)" style="width:100%;margin-top:4px;padding:2px;background:none;border:1px dashed var(--border);border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-secondary);opacity:0;transition:opacity 0.15s"
              :style="'opacity:1'"
              @mouseover="$event.target.style.opacity='1'"
              @mouseout="$event.target.style.opacity='1'">+</button>
          </div>
        </div>
      </div>

      <!-- ======= 记录详情弹窗 ======= -->
      <div class="modal-overlay" v-if="viewingRecord" @click.self="viewingRecord=null" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px">
        <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="font-size:16px;font-weight:700">记录详情</h3>
            <button @click="viewingRecord=null" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)">×</button>
          </div>
          <div v-for="f in table.fields" :key="f.name" style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;font-weight:600">{{ f.name }}</div>
            <template v-if="f.type==='checkbox'"><span :style="viewingRecord.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ viewingRecord.data[f.name] ? '☑ 是' : '☐ 否' }}</span></template>
            <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:3px 12px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:13px;font-weight:600">{{ viewingRecord.data[f.name] || '—' }}</span></template>
            <template v-else-if="f.type==='textarea'"><div style="background:var(--bg);padding:10px;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.6">{{ viewingRecord.data[f.name] || '—' }}</div></template>
            <template v-else><div style="font-size:14px">{{ viewingRecord.data[f.name] || '—' }}</div></template>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button @click="viewingRecord=null" class="btn btn-secondary" style="padding:10px 20px">关闭</button>
            <button @click="editRecord(viewingRecord);viewingRecord=null" class="btn btn-primary" style="padding:10px 20px">编辑</button>
          </div>
        </div>
      </div>

      <!-- ======= 添加/编辑记录弹窗 ======= -->
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:60px 20px 70px">
        <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="font-size:16px;font-weight:700">{{ editingRecord ? '编辑记录' : '添加记录' }}</h3>
            <button @click="closeModal" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)">×</button>
          </div>
          <div style="max-height:60vh;overflow-y:auto;padding-right:4px">
            <div class="form-group" v-for="f in table.fields" :key="f.name" style="margin-bottom:14px">
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
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
            <button @click="closeModal" class="btn btn-secondary" style="padding:10px 20px">取消</button>
            <button @click="saveRecord" :disabled="saving" class="btn btn-primary" style="padding:10px 20px">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>

      <!-- ======= 表单管理面板 ======= -->
      <div class="modal-overlay" v-if="showFormsPanel" @click.self="showFormsPanel=false" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:60px 20px 70px">
        <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="font-size:16px;font-weight:700">📋 表单管理</h3>
            <button @click="showFormsPanel=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)">×</button>
          </div>
          <!-- 新建表单 -->
          <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">创建新表单</div>
            <div class="form-group" style="margin-bottom:10px">
              <input v-model="newForm.name" placeholder="表单名称，如：客户反馈" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
            </div>
            <div class="form-group" style="margin-bottom:10px">
              <input v-model="newForm.description" placeholder="表单描述（选填）" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
            </div>
            <div style="margin-bottom:10px">
              <div style="font-size:13px;color:var(--text-secondary);margin-bottom:6px">允许填写的字段：</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                <label v-for="f in table.fields" :key="f.name" :style="newForm.allowed_fields.includes(f.name) ? 'background:var(--primary-light);border-color:var(--primary);color:var(--primary)' : ''" style="padding:4px 10px;border:1.5px solid var(--border);border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:4px">
                  <input type="checkbox" :value="f.name" v-model="newForm.allowed_fields" style="display:none">{{ f.name }}
                </label>
              </div>
            </div>
            <button @click="createForm" :disabled="savingForm || !newForm.name.trim()" class="btn btn-primary" style="width:100%;padding:10px">{{ savingForm ? '创建中...' : '创建表单' }}</button>
          </div>
          <!-- 已有表单列表 -->
          <div v-for="f in forms" :key="f.id" style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div>
                <div style="font-weight:600;font-size:14px">{{ f.name }}</div>
                <div style="font-size:12px;color:var(--text-secondary)">{{ f.description || '无描述' }} · {{ f.submit_count || 0 }} 次提交</div>
              </div>
              <button @click="deleteForm(f)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px">删除</button>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <input :value="formPublicUrl(f.public_key)" readonly style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;background:var(--bg)">
              <button @click="copyFormUrl(f.public_key)" style="padding:6px 12px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">复制</button>
            </div>
          </div>
          <div v-if="!forms.length && !newForm.name" style="text-align:center;padding:24px;color:var(--text-secondary);font-size:14px">暂无表单，创建上方表单生成分享链接</div>
        </div>
      </div>

      <!-- ======= CSV导入弹窗 ======= -->
      <div class="modal-overlay" v-if="showImport" @click.self="showImport=false" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:60px 20px 70px">
        <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:600px;max-height:80vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="font-size:16px;font-weight:700">⬆ CSV 导入</h3>
            <button @click="showImport=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)">×</button>
          </div>
          <!-- 上传步骤 -->
          <div v-if="importStep==='upload'" style="text-align:center">
            <div style="border:2px dashed var(--border);border-radius:16px;padding:40px;cursor:pointer;transition:all 0.15s"
              @click="$refs.fileInput.click()"
              @dragover.prevent="dragOver=true"
              @dragleave="dragOver=false"
              @drop.prevent="handleFileDrop"
              :style="dragOver ? 'border-color:var(--primary);background:var(--primary-light)' : ''"
              style="margin-bottom:16px">
              <div style="font-size:32px;margin-bottom:8px">📁</div>
              <div style="font-weight:600;margin-bottom:4px">点击选择或拖拽 CSV 文件到这里</div>
              <div style="font-size:13px;color:var(--text-secondary)">支持 .csv 和 .txt 文件</div>
            </div>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv,.txt" style="display:none">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">第一步：上传文件</div>
            <div style="display:flex;gap:8px;justify-content:center">
              <button @click="downloadTemplate" class="btn btn-secondary" style="padding:8px 16px;font-size:13px">下载导入模板</button>
            </div>
            <div v-if="importError" style="color:var(--danger);font-size:13px;margin-top:12px">{{ importError }}</div>
          </div>
          <!-- 预览步骤 -->
          <div v-if="importStep==='preview'">
            <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">共 {{ importData.length }} 行数据，请确认字段映射：</div>
            <div style="max-height:300px;overflow-y:auto;margin-bottom:16px">
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr><th style="padding:8px;border-bottom:1px solid var(--border);text-align:left;color:var(--text-secondary)">CSV列</th><th style="padding:8px;border-bottom:1px solid var(--border)">→</th><th style="padding:8px;border-bottom:1px solid var(--border);text-align:left">映射到字段</th></tr>
                </thead>
                <tbody>
                  <tr v-for="h in importHeaders" :key="h">
                    <td style="padding:8px;border-bottom:1px solid var(--border);font-weight:500">{{ h }}</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border);text-align:center">→</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border)">
                      <select v-model="fieldMap[h]" style="padding:4px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;outline:none;background:white">
                        <option value="">跳过此列</option>
                        <option v-for="f in table.fields" :key="f.name" :value="f.name">{{ f.name }}</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <button @click="showImport=false" class="btn btn-secondary" style="padding:10px 20px">取消</button>
              <button @click="doImport" :disabled="importing" class="btn btn-primary" style="padding:10px 20px">{{ importing ? '导入中...' : '确认导入' }}</button>
            </div>
            <div v-if="importError" style="color:var(--danger);font-size:13px;margin-top:10px">{{ importError }}</div>
          </div>
          <!-- 完成步骤 -->
          <div v-if="importStep==='done'" style="text-align:center;padding:20px">
            <div style="font-size:48px;margin-bottom:12px">✅</div>
            <div style="font-weight:700;font-size:16px;margin-bottom:8px">导入完成</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">成功导入 {{ importedCount }} 条{{ importFailed > 0 ? '，失败 ' + importFailed + ' 条' : '' }}</div>
            <button @click="showImport=false;loadRecords()" class="btn btn-primary" style="padding:10px 24px">完成</button>
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
    const viewingRecord = ref(null);
    const formData = ref({});
    const saving = ref(false);
    let searchTimer = null;

    // 视图模式
    const viewMode = ref('table');
    const kanbanGroupBy = ref('');
    const kanbanColumns = ref([]);
    const draggingId = ref(null);
    const draggingRecord = ref(null);
    const dragOverColumn = ref(null);
    const kanbanFields = computed(() => (table.value.fields || []).filter(f => f.type === 'select' || f.type === 'checkbox'));

    // 日历
    const calDateField = ref('');
    const calYear = ref(new Date().getFullYear());
    const calMonth = ref(new Date().getMonth());
    const calCells = ref([]);
    const calEventsMap = ref({});
    const calDateFields = computed(() => (table.value.fields || []).filter(f => f.type === 'date'));
    const calEventColors = ['#4F46E5','#059669','#D97706','#DC2626','#0891B2','#7C3AED','#DB2777','#0D9488'];

    // 表单管理
    const showFormsPanel = ref(false);
    const forms = ref([]);
    const savingForm = ref(false);
    const newForm = ref({ name: '', description: '', allowed_fields: [] });

    // CSV导入
    const showImport = ref(false);
    const importStep = ref('upload');
    const importData = ref([]);
    const importHeaders = ref([]);
    const fieldMap = ref({});
    const importError = ref('');
    const importing = ref(false);
    const importedCount = ref(0);
    const importFailed = ref(0);
    const dragOver = ref(false);

    function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page.value = 1; loadRecords(); }, 300); }

    function getRecordTitle(r) {
      const firstField = table.value.fields?.[0];
      return firstField ? (r.data[firstField.name] || '记录 #' + r.id) : ('记录 #' + r.id);
    }

    async function loadTable() {
      try { const res = await api.get(`/tables/${props.tableId}`); table.value = res.data; }
      catch (e) { showToast('加载失败', 'error'); }
    }

    async function loadRecords() {
      try {
        const res = await api.get(`/tables/${props.tableId}/records`, { params: { page: page.value, per_page: 20, search: search.value } });
        records.value = res.data.records; total.value = res.data.total; pages.value = res.data.pages;
      } catch (e) { showToast('加载失败', 'error'); }
    }

    function viewRecord(r) { viewingRecord.value = r; }
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
        closeModal();
        if (viewMode.value === 'kanban') loadKanban();
        else if (viewMode.value === 'calendar') loadCalendar();
        else loadRecords();
      } catch (e) { showToast(e.response?.data?.error || '保存失败', 'error'); }
      finally { saving.value = false; }
    }

    async function deleteRecord(r) {
      if (!confirm('确认删除这条记录？')) return;
      try { await api.delete(`/records/${r.id}`); showToast('已删除', 'success'); loadRecords(); }
      catch (e) { showToast('删除失败', 'error'); }
    }

    function goBack() { history.back(); }
    function closeModal() { showModal.value = false; editingRecord.value = null; formData.value = {}; }

    function switchView(mode) {
      viewMode.value = mode;
      if (mode === 'kanban') {
        if (!kanbanGroupBy.value && kanbanFields.value.length > 0) kanbanGroupBy.value = kanbanFields.value[0].name;
        loadKanban();
      } else if (mode === 'calendar') {
        if (!calDateField.value && calDateFields.value.length > 0) calDateField.value = calDateFields.value[0].name;
        loadCalendar();
      }
    }

    async function loadKanban() {
      if (!kanbanGroupBy.value) return;
      try {
        const res = await api.get(`/tables/${props.tableId}/kanban`, { params: { group_by: kanbanGroupBy.value } });
        const cols = res.data.columns || [];
        const recordsByCol = res.data.records_by_column || {};
        const colors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#9333EA', '#DB2777'];
        kanbanColumns.value = cols.map((c, i) => ({
          value: c, color: colors[i % colors.length], records: recordsByCol[c] || [],
        }));
        total.value = Object.values(recordsByCol).reduce((s, arr) => s + arr.length, 0);
      } catch (e) { showToast('加载看板失败', 'error'); }
    }

    function kanbanDragStart(r) { draggingId.value = r.id; draggingRecord.value = r; }
    function kanbanDragOver(colValue) { dragOverColumn.value = colValue; }
    function kanbanDragLeave() { dragOverColumn.value = null; }
    async function kanbanDrop(colValue) {
      if (!draggingRecord.value || !kanbanGroupBy.value) return;
      if (draggingRecord.value.data[kanbanGroupBy.value] === colValue) { draggingId.value = null; draggingRecord.value = null; dragOverColumn.value = null; return; }
      try {
        await api.put(`/records/${draggingRecord.value.id}/kanban`, { group_field: kanbanGroupBy.value, group_value: colValue });
        await loadKanban();
      } catch (e) { showToast('移动失败', 'error'); }
      draggingId.value = null; draggingRecord.value = null; dragOverColumn.value = null;
    }

    function openAddForColumn(colValue) {
      editingRecord.value = null;
      formData.value = { [kanbanGroupBy.value]: colValue };
      showModal.value = true;
    }

    function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

    function buildCalCells() {
      const y = calYear.value, m = calMonth.value;
      const firstDay = new Date(y, m, 1), lastDay = new Date(y, m + 1, 0);
      let startDow = firstDay.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
      const cells = [];
      for (let i = startDow - 1; i >= 0; i--) { const d = new Date(y, m, -i); const ds = fmtDate(d); cells.push({ day: d.getDate(), dateStr: null, isOtherMonth: true, isToday: false, events: calEventsMap.value[ds] || [] }); }
      const today = new Date();
      for (let d = 1; d <= lastDay.getDate(); d++) { const dd = new Date(y, m, d); const ds = fmtDate(dd); const isToday = dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate(); cells.push({ day: d, dateStr: ds, isOtherMonth: false, isToday, events: calEventsMap.value[ds] || [] }); }
      while (cells.length < 42) { const d = new Date(y, m + 1, cells.length - startDow - lastDay.getDate() + 1); const ds = fmtDate(d); cells.push({ day: d.getDate(), dateStr: null, isOtherMonth: true, isToday: false, events: calEventsMap.value[ds] || [] }); }
      calCells.value = cells;
    }

    async function loadCalendar() {
      if (!calDateField.value) return;
      try {
        const res = await api.get(`/tables/${props.tableId}/calendar`, { params: { date_field: calDateField.value } });
        const em = {};
        (res.data.events || []).forEach((ev, ei) => {
          em[ev.date] = (ev.records || []).map(r => ({ ...r, _label: r.data[calDateField.value] || '记录', _color: calEventColors[ei % calEventColors.length] }));
        });
        calEventsMap.value = em;
        buildCalCells();
      } catch (e) { showToast('加载日历失败', 'error'); }
    }

    function calPrevMonth() { if (calMonth.value === 0) { calMonth.value = 11; calYear.value--; } else calMonth.value--; buildCalCells(); }
    function calNextMonth() { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++; } else calMonth.value++; buildCalCells(); }
    function calToday() { const t = new Date(); calYear.value = t.getFullYear(); calMonth.value = t.getMonth(); buildCalCells(); }
    function openAddForDate(dateStr) { editingRecord.value = null; formData.value = { [calDateField.value]: dateStr }; showModal.value = true; }

    // CSV导入
    function triggerImport() { showImport.value = true; importStep.value = 'upload'; importData.value = []; importHeaders.value = []; fieldMap.value = {}; importError.value = ''; }
    function handleFileDrop(e) { dragOver.value = false; const file = e.dataTransfer.files[0]; if (file) parseFile(file); }
    function handleFileSelect(e) { const file = e.target.files[0]; if (file) parseFile(file); }
    function parseFile(file) {
      importError.value = '';
      if (!file.name.match(/\.(csv|txt)$/i)) { importError.value = '请选择 CSV 或 TXT 文件'; return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          if (lines.length < 2) { importError.value = '文件数据不足'; return; }
          function parseCSVLine(line) {
            const result = [], current = ''; let inQuote = false;
            let res = [], cur = '';
            for (let i = 0; i < line.length; i++) {
              const c = line[i];
              if (c === '"') { if (inQuote && line[i+1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
              else if (c === ',' && !inQuote) { res.push(cur.trim()); cur = ''; }
              else cur += c;
            }
            res.push(cur.trim());
            return res;
          }
          const headers = parseCSVLine(lines[0]);
          const rows = [];
          for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLine(lines[i]);
            if (vals.length === 1 && !vals[0]) continue;
            const row = {};
            headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
            rows.push(row);
          }
          importHeaders.value = headers;
          importData.value = rows;
          const map = {};
          headers.forEach(h => { const matched = table.value.fields?.find(f => f.name === h); map[h] = matched ? h : ''; });
          fieldMap.value = map;
          importStep.value = 'preview';
        } catch (err) { importError.value = '解析失败：' + err.message; }
      };
      reader.readAsText(file);
    }

    async function doImport() {
      const mappedCols = Object.entries(fieldMap.value).filter(([,v]) => v);
      if (!mappedCols.length) { importError.value = '请至少选择一个字段映射'; return; }
      importing.value = true; importError.value = '';
      let success = 0, failed = 0;
      try {
        for (const row of importData.value) {
          const recordData = {};
          for (const [csvCol, fieldName] of mappedCols) recordData[fieldName] = row[csvCol] || '';
          try { await api.post(`/tables/${props.tableId}/records`, { data: recordData }); success++; } catch { failed++; }
        }
        importedCount.value = success; importFailed.value = failed;
        importStep.value = 'done';
      } finally { importing.value = false; }
    }

    function downloadTemplate() {
      const headers = table.value.fields?.map(f => f.name) || [];
      const csv = '\uFEFF' + headers.join(',') + '\n' + headers.map(() => '').join(',');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${table.value.name || '数据'}_导入模板.csv`; a.click();
    }

    function exportCSV() {
      const fields = table.value.fields || [];
      const rows = [[...fields.map(f => f.name), 'ID', '创建时间']];
      records.value.forEach(r => { rows.push([...fields.map(f => r.data[f.name] || ''), r.id, r.created_at || '']); });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${table.value.name || '导出数据'}.csv`; a.click();
      showToast('已导出 CSV', 'success');
    }

    async function loadForms() { try { const res = await api.get(`/tables/${props.tableId}/forms`); forms.value = res.data; } catch (e) { console.error('加载表单失败', e); } }
    async function createForm() {
      if (!newForm.value.name.trim()) return;
      savingForm.value = true;
      try {
        await api.post(`/tables/${props.tableId}/forms`, { name: newForm.value.name, description: newForm.value.description, allowed_fields: newForm.value.allowed_fields });
        newForm.value = { name: '', description: '', allowed_fields: [] };
        await loadForms();
        showToast('表单创建成功', 'success');
      } catch (e) { showToast('创建失败', 'error'); }
      finally { savingForm.value = false; }
    }
    async function deleteForm(f) { if (!confirm(`删除表单「${f.name}」？`)) return; try { await api.delete(`/forms/${f.id}`); await loadForms(); showToast('已删除', 'success'); } catch (e) { showToast('删除失败', 'error'); } }
    function formPublicUrl(key) { return `${(window.location.origin || '')}/#/public/form/${key}`; }
    function copyFormUrl(key) { navigator.clipboard.writeText(formPublicUrl(key)).then(() => showToast('链接已复制', 'success')); }

    watch(showFormsPanel, (v) => { if (v) loadForms(); });
    watch(() => table.value.fields, (fields) => { newForm.value.allowed_fields = fields.map(f => f.name); }, { immediate: true });
    watch(() => props.tableId, () => {
      viewMode.value = 'table';
      showFormsPanel.value = false;
      showImport.value = false;
      loadTable();
      loadRecords();
    }, { immediate: true });

    return {
      table, records, total, pages, page, search, showModal, editingRecord, viewingRecord, formData, saving,
      viewMode, kanbanGroupBy, kanbanColumns, kanbanFields, draggingId, dragOverColumn,
      calDateField, calYear, calMonth, calCells, calDateFields, calEventColors,
      showFormsPanel, forms, savingForm, newForm,
      showImport, importStep, importData, importHeaders, fieldMap, importError, importing, importedCount, importFailed, dragOver,
      debounceSearch, getRecordTitle, loadRecords, viewRecord, openAdd, editRecord, saveRecord, deleteRecord, closeModal, goBack,
      switchView, loadKanban, kanbanDragStart, kanbanDragOver, kanbanDragLeave, kanbanDrop, openAddForColumn,
      calPrevMonth, calNextMonth, calToday, loadCalendar, openAddForDate,
      triggerImport, handleFileDrop, handleFileSelect, parseFile, doImport, downloadTemplate, exportCSV,
      loadForms, createForm, deleteForm, formPublicUrl, copyFormUrl,
    };
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
        <div class="topbar" style="display:flex;align-items:center;justify-content:space-between">
          <div class="topbar-title">{{ currentView === 'app' ? '应用详情' : currentView === 'table' ? '数据管理' : '我的应用' }}</div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:13px;color:var(--text-secondary);display:none" class="show-mobile">我的</div>
            <button @click="logout" class="btn btn-secondary show-desktop" style="padding:6px 14px;font-size:13px;border-radius:20px">退出</button>
          </div>
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
        <div class="mobile-nav-item" @click="confirm('确定退出登录？') && logout()">
          <i class="pi pi-user"></i>
          <span>我的</span>
        </div>
      </nav>
    </div>
  `,
  components: { AuthPage, AppList, AppDetail, TableDetail }
};

const app = createApp(App);
app.mount('#app');
