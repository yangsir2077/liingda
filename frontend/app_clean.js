// 零搭 NoCode Platform - Frontend App
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

// API 基础 URL
const API_BASE = '/api';

// Axios 实例
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lingda_token');
  // 防御：token 必须是有效的 JWT 格式才发送
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
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
const ICON_SVGS = {
  '信封': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  '文档': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  '客户': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  '数据': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  '项目': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  '日程': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  '财务': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  '库存': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  '行政': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  '客服': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  '培训': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  '物流': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  '工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
};
const ICON_OPTIONS = [
  { label: '文档', bg: '#EEF2FF', color: '#4F46E5', svg: ICON_SVGS['文档'] },
  { label: '客户', bg: '#E0F2FE', color: '#0891B2', svg: ICON_SVGS['客户'] },
  { label: '数据', bg: '#D1FAE5', color: '#059669', svg: ICON_SVGS['数据'] },
  { label: '项目', bg: '#FEF3C7', color: '#D97706', svg: ICON_SVGS['项目'] },
  { label: '日程', bg: '#F3E8FF', color: '#7C3AED', svg: ICON_SVGS['日程'] },
  { label: '财务', bg: '#FEE2E2', color: '#DC2626', svg: ICON_SVGS['财务'] },
  { label: '库存', bg: '#FFEDD5', color: '#EA580C', svg: ICON_SVGS['库存'] },
  { label: '行政', bg: '#F1F5F9', color: '#64748B', svg: ICON_SVGS['行政'] },
  { label: '客服', bg: '#FCE7F3', color: '#DB2777', svg: ICON_SVGS['客服'] },
  { label: '培训', bg: '#CCFBF1', color: '#0D9488', svg: ICON_SVGS['培训'] },
  { label: '物流', bg: '#EDE9FE', color: '#9333EA', svg: ICON_SVGS['物流'] },
  { label: '工具', bg: '#E2E8F0', color: '#475569', svg: ICON_SVGS['工具'] },
];
const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(i => [i.label, i]));
function getAppIcon(label) { return ICON_MAP[label] || ICON_OPTIONS[0]; }

// ============ 认证页面 ============
 AuthPage = {
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>零搭</h1>
          <p>可视化管理系统构建平台</p>
        </div>
        <div class="auth-tabs" v-if="mode !== 'verify'">
          <div class="auth-tab" :class="{active: mode === 'login'}" @click="mode = 'login'">登录</div>
          <div class="auth-tab" :class="{active: mode === 'register'}" @click="mode = 'register'">注册</div>
        </div>
        <div v-if="mode === 'verify'" style="text-align:center;margin-bottom:16px">
          <div style="width:48px;height:48px;background:#EEF2FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;color:#4F46E5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <p style="font-size:14px;color:var(--text-secondary)">验证码已发送到 {{ verifyEmail }}</p>
        </div>
        <form @submit.prevent="mode === 'verify' ? verifyEmailSubmit() : submit()">
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="email" placeholder="your@email.com" :required="mode !== 'verify'">
          </div>
          <div class="form-group" v-if="mode !== 'verify'">
            <label>密码</label>
            <input type="password" v-model="password" placeholder="至少6位" :required="mode !== 'verify'">
          </div>
          <div class="form-group" v-if="mode === 'register'">
            <label>昵称（选填）</label>
            <input type="text" v-model="name" placeholder="你怎么称呼">
          </div>
          <div class="form-group" v-if="mode === 'verify'">
            <label>验证码</label>
            <input type="text" v-model="verifyCode" placeholder="请输入6位验证码" maxlength="6" required style="letter-spacing:4px;font-size:18px;text-align:center">
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '处理中...' : (mode === 'login' ? '登录' : mode === 'register' ? '注册' : '验证邮箱') }}
          </button>
        </form>
        <div v-if="mode === 'verify'" style="margin-top:12px;text-align:center">
          <a href="#" @click.prevent="mode = 'login'" style="color:var(--primary);font-size:13px">返回登录</a>
        </div>
      </div>
    </div>
  `,
  setup() {
    const mode = ref('login');
    const email = ref('');
    const password = ref('');
    const name = ref('');
    const verifyEmail = ref('');
    const verifyCode = ref('');
    const loading = ref(false);
    async function submit() {
      loading.value = true;
      try {
        const endpoint = mode.value === 'login' ? '/auth/login' : '/auth/register';
        const payload = mode.value === 'login'
          ? { email: email.value, password: password.value }
          : { email: email.value, password: password.value, name: name.value };
        const res = await api.post(endpoint, payload);
        if (res.data.need_verify) {
          verifyEmail.value = res.data.email || email.value;
          mode.value = 'verify';
          return;
        }
        localStorage.setItem('lingda_token', res.data.token);
        location.hash = '#dashboard';
        location.reload();
      } catch (e) {
        showToast(e.response?.data?.error || '操作失败', 'error');
      } finally { loading.value = false; }
    }
    async function verifyEmailSubmit() {
      loading.value = true;
      try {
        const res = await api.post('/auth/verify-email', { email: verifyEmail.value, code: verifyCode.value });
        showToast('验证成功，即将登录...', 'success');
        localStorage.setItem('lingda_token', res.data.token);
        setTimeout(() => { location.hash = '#dashboard'; location.reload(); }, 800);
      } catch (e) {
        showToast(e.response?.data?.error || '验证码错误', 'error');
      } finally { loading.value = false; }
    }
    return { mode, email, password, name, verifyEmail, verifyCode, loading, submit, verifyEmailSubmit };
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
      <!-- 统计卡片 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px">
        <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;padding:16px 20px;border-radius:12px">
          <div style="font-size:28px;font-weight:800">{{ apps.length }}</div>
          <div style="font-size:13px;opacity:0.85">应用总数</div>
        </div>
        <div style="background:linear-gradient(135deg,#059669,#10B981);color:white;padding:16px 20px;border-radius:12px">
          <div style="font-size:28px;font-weight:800">{{ totalTables }}</div>
          <div style="font-size:13px;opacity:0.85">数据表总数</div>
        </div>
        <div style="background:linear-gradient(135deg,#D97706,#F59E0B);color:white;padding:16px 20px;border-radius:12px">
          <div style="font-size:28px;font-weight:800">{{ totalRecords }}</div>
          <div style="font-size:13px;opacity:0.85">记录总数</div>
        </div>
        <div style="background:linear-gradient(135deg,#DC2626,#EF4444);color:white;padding:16px 20px;border-radius:12px">
          <div style="font-size:28px;font-weight:800">{{ totalForms }}</div>
          <div style="font-size:13px;opacity:0.85">公开表单</div>
        </div>
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
            <div class="app-card-icon" :style="{ background: (ICON_MAP[app.icon] || ICON_OPTIONS[0]).bg, color: (ICON_MAP[app.icon] || ICON_OPTIONS[0]).color }" v-html="(ICON_MAP[app.icon] || ICON_OPTIONS[0]).svg"></div>
            <div class="app-card-name">{{ app.name }}</div>
            <div class="app-card-desc">{{ app.description || '暂无描述' }}</div>
            <div class="app-card-meta">
              <span>{{ app.table_count }} 个数据表</span>
              <button @click.stop="deleteApp(app)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px;font-weight:600;padding:0;margin-left:auto">删除</button>
            </div>
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
                <div v-for="opt in ICON_OPTIONS" :key="opt.label"
                  @click="pickIcon(opt.label)"
                  :style="newApp.icon === opt.label ? 'border-color:' + opt.color + ';background:' + opt.bg : ''"
                  style="padding:10px 6px;border-radius:10px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.15s">
                  <div v-html="opt.svg" style="width:28px;height:28px;margin:0 auto 4px;color:#333"></div>
                  <div style="font-size:10px;color:var(--text-secondary)">{{ opt.label }}</div>
                </div>
                <div @click="showIconPicker = true"
                  style="padding:10px 6px;border-radius:10px;border:2px dashed var(--border);cursor:pointer;text-align:center;transition:all 0.15s;color:var(--text-secondary)">
                  <div style="width:28px;height:28px;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-secondary)">+</div>
                  <div style="font-size:10px">自定义</div>
                </div>
              </div>
              <!-- 选中图标预览 -->
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <span style="font-size:13px;color:var(--text-secondary)">当前：</span>
                <div :style="{ width:'36px',height:'36px',padding:'6px',background:getAppIcon(newApp.icon).bg,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center' }"><div v-html="getAppIcon(newApp.icon).svg" :style="{ width:'24px',height:'24px',color:getAppIcon(newApp.icon).color }"></div></div>
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
    const newApp = ref({ name: '', icon: '文档', description: '' });
    const creating = ref(false);
    const ICON_LIST = '▤⊕▊◫✔¥⚡✉✏◁⚡◈⬡✧◎⬢✶☰◆▣◈'.split('');
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
    function pickIcon(label) { newApp.value.icon = label; }
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
        newApp.value = { name: '', icon: '文档', description: '' };
        showToast('应用创建成功', 'success');
        openApp(res.data);
      } catch (e) { showToast(e.response?.data?.error || '创建失败', 'error'); }
      finally { creating.value = false; }
    }
    onMounted(load);
    return { apps, showCreate, showIconPicker, newApp, creating, openApp, createApp, pickIcon, handleCardClick, deleteApp, goBack, ICON_OPTIONS, ICON_MAP, getAppIcon, swipedId, transitioning, onTouchStart, onTouchMove, onTouchEnd };
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
            <span v-html="getAppIcon(app.icon).svg" :style="{ color: getAppIcon(app.icon).color, width: '24px', height: '24px' }"></span> {{ app.name }}
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
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:15px;">{{ t.name }}</div>
                <div style="font-size:12px;color:var(--text-secondary);">{{ t.record_count }} 条 · {{ t.fields?.length || 0 }} 个字段</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0">
              <button class="btn btn-secondary" @click.stop="editTable(t)" style="padding:5px 12px;font-size:12px;border-radius:6px">编辑</button>
              <button class="btn btn-secondary" @click.stop="deleteTable(t)" style="padding:5px 12px;font-size:12px;border-radius:6px;color:var(--danger)">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div style="width:56px;height:56px;margin:0 auto 16px;color:var(--text-secondary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:56px;height:56px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
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
              <!-- 格式校验 -->
              <select v-if="f.type!=='checkbox'" v-model="f.pattern" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;color:var(--text-secondary);background:white;max-width:80px" title="格式">
                <option v-for="p in fieldPatterns" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
              <input v-if="f.pattern==='custom'" v-model="f.customPattern" placeholder="正则" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;width:80px;outline:none" title="自定义正则">
              <button @click="removeField(i)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:16px;flex-shrink:0">×</button>
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
      { value: 'text', label: '文本' },
      { value: 'number', label: '数字' },
      { value: 'select', label: '下拉' },
      { value: 'checkbox', label: '复选' },
      { value: 'date', label: '日期' },
      { value: 'textarea', label: '多行文本' },
      { value: 'phone', label: '手机号' },
      { value: 'email', label: '邮箱' },
      { value: 'url', label: '网址' },
      { value: 'currency', label: '金额' },
      { value: 'desc', label: '说明文字' },
      { value: 'separator', label: '分段线' },
    ];
    const fieldPatterns = [
      { value: '', label: '无' },
      { value: 'phone', label: '手机号' },
      { value: 'email', label: '邮箱' },
      { value: 'url', label: '网址' },
      { value: 'idcard', label: '身份证' },
      { value: 'custom', label: '自定义' },
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
    function addField(type) { tableForm.value.fields.push({ name: '', type: type.value, required: false, pattern: '', customPattern: '', options: type.value === 'select' ? ['选项1', '选项2'] : [] }); }
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
    return { app, tables, showBuilder, editingTable, tableForm, saving, fieldTypes, fieldPatterns, hoverStyle, openTable, openBuilder, editTable, deleteTable, addField, removeField, toggleRequired, fieldTypeLabel, addOption, ensureOption, syncSlug, saveTable, goBack, getAppIcon, ICON_OPTIONS, ICON_MAP };
  }
};

// ============ 个人中心页 ============
// ============ 公开表单页 ============
const FormPublicPage = {
  props: ['formKey'],
  setup(props) {
    const form = ref(null);
    const records = ref([]);
    const fields = ref([]);
    const loading = ref(true);
    const submitted = ref(false);
    const submitting = ref(false);
    const formValues = ref({});
    const errorMsg = ref('');
    async function loadForm() {
      try {
        const res = await api.get(`/public/forms/${props.formKey}`);
        form.value = { id: res.data.id, name: res.data.name, description: res.data.description, public_key: props.formKey };
        fields.value = res.data.fields || [];
        // 加载已提交记录
        const recRes = await api.get(`/tables/${res.data.table_id}/records`);
        records.value = recRes.data.records || [];
        fields.value.forEach(f => { formValues.value[f.name] = f.type === 'checkbox' ? [] : ''; });
      } catch (e) { errorMsg.value = '表单不存在或已失效'; }
      finally { loading.value = false; }
    }
    async function submitForm() {
      submitting.value = true;
      errorMsg.value = '';
      try { await api.post(`/public/forms/${props.formKey}`, { data: formValues.value }); submitted.value = true; }
      catch (e) { errorMsg.value = e.response?.data?.error || '提交失败，请稍后重试'; }
      finally { submitting.value = false; }
    }
    onMounted(loadForm);
    return { form, records, fields, loading, submitted, submitting, formValues, errorMsg, submitForm };
  },
  template: `
    <div style="max-width:720px;margin:0 auto;padding:32px 16px">
      <div v-if="loading" style="text-align:center;padding:60px;color:var(--text-secondary)">加载中...</div>
      <div v-else-if="errorMsg" style="text-align:center;padding:60px">
        <div style="width:48px;height:48px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#DC2626;font-size:24px;font-weight:700">!</div>
        <h3 style="margin-bottom:8px">{{ errorMsg }}</h3>
        <p style="color:var(--text-secondary);font-size:14px">请联系表单创建者确认链接是否正确</p>
      </div>
      <div v-else-if="submitted" style="text-align:center;padding:60px">
        <div style="width:64px;height:64px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-size:32px">✓</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px">提交成功！</h3>
        <p style="color:var(--text-secondary)">感谢您的填写，数据已提交</p>
      </div>
      <div v-else-if="form">
        <div style="background:white;border-radius:16px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid var(--border)">
          <h2 style="font-size:22px;font-weight:800;margin-bottom:8px">{{ form.name }}</h2>
          <p v-if="form.description" style="color:var(--text-secondary);font-size:14px;margin-bottom:24px">{{ form.description }}</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div v-for="f in fields" :key="f.name">
              <label style="font-weight:600;font-size:14px;margin-bottom:6px;display:block">{{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span></label>
              <input v-if="f.type==='text' || f.type==='email' || f.type==='phone' || f.type==='url'" v-model="formValues[f.name]" :type="f.type==='email'?'email':f.type==='phone'?'tel':f.type==='url'?'url':'text'" :placeholder="'请输入'+f.name" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box">
              <input v-if="f.type==='number'" v-model.number="formValues[f.name]" type="number" :placeholder="'请输入'+f.name" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box">
              <textarea v-if="f.type==='textarea'" v-model="formValues[f.name]" :placeholder="'请输入'+f.name" rows="3" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;resize:vertical;box-sizing:border-box"></textarea>
              <select v-if="f.type==='select'" v-model="formValues[f.name]" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box">
                <option value="">请选择</option>
                <option v-for="opt in (f.options||[])" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <div v-if="f.type==='checkbox'" style="display:flex;flex-wrap:wrap;gap:8px">
                <label v-for="opt in (f.options||[])" :key="opt" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;cursor:pointer;font-size:14px" :style="formValues[f.name]?.includes(opt) ? 'border-color:var(--primary);background:var(--primary-light);color:var(--primary)' : ''">
                  <input type="checkbox" :value="opt" v-model="formValues[f.name]" style="display:none">
                  {{ opt }}
                </label>
              </div>
              <input v-if="f.type==='date'" v-model="formValues[f.name]" type="date" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box">
            </div>
          </div>
          <div v-if="errorMsg" style="color:var(--danger);font-size:13px;margin-top:12px">{{ errorMsg }}</div>
          <button @click="submitForm" :disabled="submitting" style="width:100%;padding:14px;background:var(--primary);color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px">{{ submitting ? '提交中...' : '立即提交' }}</button>
        </div>
        <div v-if="records.length" style="margin-top:32px">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:12px">已提交的记录（共 {{ records.length }} 条）</h4>
          <div style="background:white;border-radius:12px;overflow:hidden;border:1px solid var(--border);overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:400px">
              <thead><tr><th v-for="f in fields" :key="f.name" style="padding:10px 14px;background:var(--bg);font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border);text-align:left;white-space:nowrap">{{ f.name }}</th></tr></thead>
              <tbody>
                <tr v-for="(r,idx) in records.slice(0,50)" :key="idx">
                  <td v-for="f in fields" :key="f.name" style="padding:10px 14px;font-size:14px;border-bottom:1px solid var(--border);white-space:nowrap">{{ r.data && r.data[f.name] !== undefined ? r.data[f.name] : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
};

const UserManagement = {
  template: `
    <div style="padding:0">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <input v-model="search" @input="debounce(loadUsers, 300)" placeholder="搜索用户邮箱或姓名..." style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
      </div>
      <div v-if="loading" style="text-align:center;padding:48px;color:var(--text-secondary)">加载中...</div>
      <div v-else-if="error" style="text-align:center;padding:48px;color:var(--danger)">{{ error }}</div>
      <div v-else>
        <div style="background:var(--surface);border-radius:12px;border:1px solid var(--border);overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);background:var(--bg);border-bottom:1px solid var(--border)">用户</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);background:var(--bg);border-bottom:1px solid var(--border)">角色</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);background:var(--bg);border-bottom:1px solid var(--border)">注册时间</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);background:var(--bg);border-bottom:1px solid var(--border)">状态</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text-secondary);background:var(--bg);border-bottom:1px solid var(--border)">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" style="border-bottom:1px solid var(--border)">
                <td style="padding:14px 16px">
                  <div style="font-weight:600">{{ u.name }}</div>
                  <div style="font-size:13px;color:var(--text-secondary)">{{ u.email }}</div>
                </td>
                <td style="padding:14px 16px">
                  <span v-if="u.is_admin" style="background:var(--accent);color:white;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600">管理员</span>
                  <span v-else style="background:var(--bg);color:var(--text-secondary);padding:2px 10px;border-radius:10px;font-size:12px">普通用户</span>
                </td>
                <td style="padding:14px 16px;font-size:13px;color:var(--text-secondary)">{{ new Date(u.created_at).toLocaleDateString('zh-CN') }}</td>
                <td style="padding:14px 16px">
                  <span v-if="u.email_verified" style="color:var(--accent);font-size:13px;font-weight:600">已验证</span>
                  <span v-else style="color:var(--warning);font-size:13px">未验证</span>
                </td>
                <td style="padding:14px 16px">
                  <button v-if="!u.is_admin" @click="toggleAdmin(u)" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px">设为管理</button>
                  <button v-if="u.is_admin && u.id !== currentUserId" @click="revokeAdmin(u)" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px">撤销管理</button>
                  <button @click="deleteUser(u)" style="background:none;border:none;color:var(--danger);font-size:12px;cursor:pointer;padding:4px 6px">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalPages > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px">
          <button v-for="p in totalPages" :key="p" @click="page=p;loadUsers()" :style="p === page ? 'background:var(--primary);color:white;border:none' : 'background:white;border:1px solid var(--border)'" style="padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px">{{ p }}</button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const users = ref([]);
    const loading = ref(true);
    const error = ref('');
    const search = ref('');
    const page = ref(1);
    const totalPages = ref(1);
    const currentUserId = ref(null);
    let debounceTimer = null;
    function debounce(fn, ms) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fn, ms);
    }
    async function loadUsers() {
      loading.value = true;
      error.value = '';
      try {
        const r = await api.get('/admin/users', { params: { page: page.value, per_page: 20, search: search.value } });
        users.value = r.data.users;
        totalPages.value = r.data.total_pages || 1;
        const me = await api.get('/auth/me');
        currentUserId.value = me.data.id;
      } catch (e) { error.value = '加载失败：无权限或网络错误'; }
      finally { loading.value = false; }
    }
    async function toggleAdmin(u) {
      try {
        await api.post(`/admin/users/${u.id}/toggle-admin`);
        u.is_admin = true;
        showToast('已设为管理员', 'success');
      } catch (e) { showToast('操作失败', 'error'); }
    }
    async function revokeAdmin(u) {
      try {
        await api.post(`/admin/users/${u.id}/toggle-admin`);
        u.is_admin = false;
        showToast('已撤销管理员权限', 'success');
      } catch (e) { showToast('操作失败', 'error'); }
    }
    async function deleteUser(u) {
      if (!confirm(`确定删除用户 ${u.name} (${u.email})？此操作不可恢复！`)) return;
      try {
        await api.delete(`/admin/users/${u.id}`);
        users.value = users.value.filter(x => x.id !== u.id);
        showToast('已删除', 'success');
      } catch (e) { showToast('删除失败', 'error'); }
    }
    onMounted(loadUsers);
    return { users, loading, error, search, page, totalPages, currentUserId, loadUsers, debounce, toggleAdmin, revokeAdmin, deleteUser };
  }
};

const ProfilePage = {
  setup() {
    const userInfo = ref(null);
    const deleting = ref(false);
    async function loadUser() {
      try { const res = await api.get('/auth/me'); userInfo.value = res.data; } 
      catch { userInfo.value = { name: '未知用户' }; }
    }
    function logout() { localStorage.removeItem('lingda_token'); location.hash = '#login'; location.reload(); }
    async function deleteAccount() {
      const password = prompt('请输入当前密码以确认注销账号：');
      if (!password) return;
      if (!confirm('确定要注销账号吗？此操作不可恢复，所有数据将永久删除！')) return;
      deleting.value = true;
      try {
        await api.post('/auth/delete-account', { password });
        localStorage.removeItem('lingda_token');
        location.hash = '#login';
        location.reload();
      } catch (e) { alert('注销失败：' + (e.response?.data?.error || '密码错误或请稍后重试')); deleting.value = false; }
    }
    onMounted(loadUser);
    return { userInfo, deleting, logout, deleteAccount };
  },
  template: `
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:24px">个人中心</h2>
      <div v-if="userInfo" style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:700">
            {{ userInfo.name ? userInfo.name[0] : '?' }}
          </div>
          <div style="flex:1">
            <div style="font-size:18px;font-weight:700">{{ userInfo.name || '未知用户' }}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">{{ userInfo.email || '' }}</div>
          </div>
          <button @click="logout" style="background:var(--danger);color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:13px">退出登录</button>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:16px">
          <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">账号信息</div>
          <div style="font-size:14px">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>邮箱</span><span>{{ userInfo.email || '-' }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>角色</span><span style="color:#4F46E5;font-weight:600">{{ userInfo.is_admin ? '管理员' : '普通用户' }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0"><span>注册时间</span><span>{{ userInfo.created_at ? userInfo.created_at.slice(0,10) : '-' }}</span></div>
          </div>
        </div>
        <div style="border-top:1px solid var(--danger);margin-top:16px;padding-top:16px">
          <div style="font-size:14px;color:var(--danger);font-weight:600;margin-bottom:8px">危险操作</div>
          <button @click="deleteAccount" :disabled="deleting" style="background:white;color:var(--danger);border:1.5px solid var(--danger);border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px">
            {{ deleting ? '注销中...' : '注销账号' }}
          </button>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">注销后账号和所有数据将被永久删除，无法恢复</div>
        </div>
      </div>
      <div v-else style="text-align:center;padding:40px;color:var(--text-secondary)">加载中...</div>
    </div>
  `
};

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
          <button class="btn btn-secondary" @click="showFormsPanel=true" style="padding:8px 12px;font-size:13px" title="表单管理"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>表单</button>
          <button class="btn btn-secondary" @click="showImport=true" style="padding:8px 12px;font-size:13px" title="导入CSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>导入</button>
          <button class="btn btn-secondary" @click="exportCSV" style="padding:8px 12px;font-size:13px" title="导出CSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><polyline points="8 7 12 3 16 7"/><line x1="12" y1="3" x2="12" y2="16"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>导出</button>
          <button class="btn btn-secondary" @click="location.hash='#app/'+appId" style="padding:8px 12px;font-size:13px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>设计</button>
          <button class="btn btn-primary" @click="openAdd" style="padding:8px 16px;font-size:14px">+ 添加</button>
        </div>
      </div>

      <!-- 视图切换 tabs -->
      <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0">
        <button @click="switchView('table')" :style="viewMode==='table' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>表格</button>
        <button v-if="kanbanFields.length" @click="switchView('kanban')" :style="viewMode==='kanban' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>看板</button>
        <button @click="switchView('gallery')" :style="viewMode==='gallery' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>卡片</button>
        <button v-if="calDateFields.length" @click="switchView('calendar')" :style="viewMode==='calendar' ? 'border-bottom:2.5px solid var(--primary);color:var(--primary);font-weight:700' : 'border-bottom:2.5px solid transparent;color:var(--text-secondary)'" style="background:none;border:none;padding:8px 16px;font-size:14px;cursor:pointer;transition:all 0.15s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>日历</button>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="showBatchPanel" style="background:var(--primary);color:white;padding:12px 16px;border-radius:10px;margin-bottom:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-weight:600">已选 {{ selectedIds.size }} 条</span>
        <button @click="batchDelete" style="background:#FEE2E2;color:#DC2626;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:600">批量删除</button>
        <div style="display:flex;align-items:center;gap:6px;margin-left:auto">
          <span style="font-size:13px">批量修改：</span>
          <select v-model="batchField" style="padding:6px 10px;border:1px solid rgba(255,255,255,0.3);border-radius:6px;font-size:13px;background:rgba(255,255,255,0.15);color:white;outline:none">
            <option value="">选择字段</option>
            <option v-for="f in table.fields" :key="f.name" :value="f.name">{{ f.name }}</option>
          </select>
          <input v-if="batchField" v-model="batchValue" placeholder="输入值" style="padding:6px 10px;border:1px solid rgba(255,255,255,0.3);border-radius:6px;font-size:13px;background:rgba(255,255,255,0.15);color:white;outline:none;width:120px">
          <button v-if="batchField && batchValue" @click="batchUpdateField" style="background:white;color:var(--primary);border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:600">应用</button>
        </div>
        <button @click="clearSelection" style="background:none;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.3);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:13px">取消</button>
      </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input v-model="search" @input="debounceSearch" placeholder="搜索记录..." style="max-width:200px;flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
          <button @click="showColPanel=!showColPanel" style="padding:8px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>列
          </button>
          <span style="font-size:13px;color:var(--text-secondary)">共 {{ total }} 条</span>
          <select v-model="perPage" @change="page=1;loadRecords()" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none">
            <option :value="10">10条/页</option><option :value="20">20条/页</option><option :value="50">50条/页</option><option :value="100">100条/页</option>
          </select>
        </div>
        <!-- 列筛选弹窗 -->
        <div v-if="showColPanel" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:8px">
          <span style="font-size:12px;color:var(--text-secondary);width:100%;margin-bottom:4px;font-weight:600">显示/隐藏列</span>
          <button v-for="f in table.fields" :key="f.name" @click="toggleCol(f.name)" :style="hiddenCols.has(f.name) ? 'background:var(--bg);color:var(--text-secondary);border:1px solid var(--border);text-decoration:line-through' : 'background:var(--primary-light);color:var(--primary);border:1px solid var(--primary)'" style="padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer">{{ f.name }}</button>
        </div>
        <!-- 筛选栏 -->
        <div v-if="Object.keys(filters).length > 0 || Object.values(filters).some(v=>v!=='')" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-secondary)">筛选：</span>
          <div v-for="(val, key) in filters" :key="key" style="display:flex;align-items:center;gap:4px;background:var(--bg);padding:4px 8px;border-radius:6px;font-size:12px">
            <span style="font-weight:600">{{ key }}</span>
            <span style="color:var(--text-secondary)">=</span>
            <span>{{ val || '(空)' }}</span>
            <button @click="filters[key]='';page=1;loadRecords()" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:0;font-size:14px;line-height:1">×</button>
          </div>
          <button @click="Object.keys(filters).forEach(k=>filters[k]='');page=1;loadRecords()" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:12px">清除筛选</button>
        </div>
      </div>

      <!-- ======= 表格视图 ======= -->
      <div v-if="viewMode==='table'">
        <!-- 桌面表格 -->
        <div class="desktop-table" style="background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border)">
          <table style="width:100%;border-collapse:collapse;min-width:500px">
            <thead>
              <tr>
                <th style="padding:12px 8px;width:40px;background:var(--bg);border-bottom:1px solid var(--border)">
                  <input type="checkbox" :checked="selectedIds.size===records.length && records.length>0" @change="toggleSelectAll" style="cursor:pointer;width:16px;height:16px">
                </th>
                <th v-for="f in table.fields" :key="f.name" :style="(hiddenCols.has(f.name) ? 'display:none; ' : '') + (sortField===f.name ? 'color:var(--primary)' : 'color:var(--text-secondary)')" style="padding:8px 16px 4px;text-align:left;font-weight:700;font-size:13px;border-bottom:1px solid var(--border);white-space:nowrap;background:var(--bg);user-select:none">
                  <div style="display:flex;flex-direction:column;gap:4px">
                    <div style="display:flex;align-items:center;gap:4px;cursor:pointer" @click="toggleSort(f.name)">
                      {{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span>
                      <span v-if="sortField===f.name" style="margin-left:2px">{{ sortOrder==='asc' ? '↑' : '↓' }}</span>
                      <span v-else style="margin-left:2px;opacity:0.3">↕</span>
                    </div>
                    <input v-if="f.type!=='checkbox'" v-model="filters[f.name]" @input="debounceFilter" :placeholder="f.type==='select' ? '筛选选项...' : '筛选...'"
                      style="padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;width:100%;background:white">
                  </div>
                </th>
                <th style="padding:12px 16px;width:110px;background:var(--bg);border-bottom:1px solid var(--border)">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!records.length"><td :colspan="(table.fields?.length||1)+1" style="text-align:center;padding:48px;color:var(--text-secondary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;margin:0 auto 8px;display:block;color:var(--text-secondary)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>暂无数据</td></tr>
              <tr v-for="r in records" :key="r.id" :style="selectedIds.has(r.id) ? 'background:var(--primary-light)' : 'transition:background 0.1s;cursor:pointer'" @click="viewRecord(r)">
                <td style="padding:12px 8px;border-bottom:1px solid var(--border)" @click.stop>
                  <input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleSelect(r.id)" style="cursor:pointer;width:16px;height:16px">
                </td>
                <td v-for="f in table.fields" :key="f.name" :style="hiddenCols.has(f.name) ? 'display:none' : ''" style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px">
                  <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>{{ r.data[f.name] ? '是' : '否' }}</span></template>
                  <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 10px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                  <template v-else-if="f.type==='desc'"><span style="color:var(--text-secondary);font-size:14px;font-style:italic">{{ r.data[f.name] }}</span></template>
                  <template v-else-if="f.type==='separator'"><hr style="border:none;border-top:1px solid var(--border);margin:8px 0"></template>
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
                <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>{{ r.data[f.name] ? '是' : '否' }}</span></template>
                <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 8px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                <template v-else><span style="font-size:14px;font-weight:500">{{ r.data[f.name] || '—' }}</span></template>
              </div>
            </div>
          </div>
          <div v-if="!records.length" style="text-align:center;padding:40px;color:var(--text-secondary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;margin:0 auto 8px;display:block;color:var(--text-secondary)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>暂无数据</div>
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
          <span style="font-size:13px;background:var(--primary-light);color:var(--primary);padding:4px 12px;border-radius:20px;font-weight:600">共 {{ total }} 条记录</span>
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
              <span style="font-size:12px;color:white;background:rgba(0,0,0,0.2);padding:2px 10px;border-radius:10px;font-weight:700">{{ col.records.length }} 条</span>
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

      <!-- ======= 卡片视图 ======= -->
      <div v-if="viewMode==='gallery'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <span style="font-size:13px;background:var(--primary-light);color:var(--primary);padding:4px 12px;border-radius:20px;font-weight:600">共 {{ total }} 条记录</span>
          <select v-model="galleryField" @change="loadGallery" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:white">
            <option value="">自动识别标题字段</option>
            <option v-for="f in table.fields" :key="f.name" :value="f.name">{{ f.name }}</option>
          </select>
        </div>
        <div v-if="!records.length" style="text-align:center;padding:60px;color:var(--text-secondary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 12px;display:block"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          暂无数据
        </div>
        <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
          <div v-for="r in records" :key="r.id"
            style="background:var(--surface);border-radius:14px;border:1.5px solid var(--border);padding:16px;cursor:pointer;transition:all 0.15s;position:relative;overflow:hidden"
            @mouseover="$event.currentTarget.style.borderColor='var(--primary)';$event.currentTarget.style.boxShadow='0 4px 16px rgba(79,70,229,0.15)'"
            @mouseout="$event.currentTarget.style.borderColor='var(--border)';$event.currentTarget.style.boxShadow='none'"
            @click="viewRecord(r)">
            <div v-if="r.data[galleryField] || r.data[getTitleField()]" style="margin-bottom:12px">
              <div :style="'font-weight:700;font-size:15px;margin-bottom:4px;color:' + (getSelectColor(r) || 'var(--text)') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap'">{{ r.data[galleryField] || r.data[getTitleField()] }}</div>
              <div v-if="getSelectColor(r)" style="width:36px;height:4px;border-radius:2px" :style="'background:' + getSelectColor(r)"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
              <div v-for="f in galleryShowFields(r)" :key="f.name" style="display:flex;gap:8px;align-items:flex-start">
                <span style="font-size:12px;color:var(--text-secondary);min-width:60px;flex-shrink:0;padding-top:2px">{{ f.name }}</span>
                <span v-if="f.type === 'checkbox'" :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'" style="font-size:13px">{{ r.data[f.name] ? '是' : '否' }}</span>
                <span v-else-if="f.type === 'select'" style="display:inline-block;padding:1px 8px;background:var(--primary-light);color:var(--primary);border-radius:12px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span>
                <span v-else style="font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.data[f.name] || '—' }}</span>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid var(--border)">
              <button @click.stop="editRecord(r)" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;color:var(--primary)">编辑</button>
              <button @click.stop="deleteRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:12px">删除</button>
            </div>
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
            <template v-if="f.type==='checkbox'"><span :style="viewingRecord.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>{{ viewingRecord.data[f.name] ? '是' : '否' }}</span></template>
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
            <h3 style="font-size:16px;font-weight:700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>表单管理</h3>
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
            <h3 style="font-size:16px;font-weight:700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>CSV 导入</h3>
            <button @click="showImport=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)">×</button>
          </div>
          <!-- 上传步骤 -->
          <div v-if="importStep==='upload'" style="text-align:center">
            <div style="border:2px dashed var(--border);border-radius:16px;padding:40px;cursor:pointer;transition:all 0.15s;margin-bottom:16px"
              @click="$refs.fileInput.click()"
              @dragover.prevent="dragOver=true"
              @dragleave="dragOver=false"
              @drop.prevent="handleFileDrop"
              :style="dragOver ? 'border-color:var(--primary);background:var(--primary-light)' : ''">
              <div style="width:48px;height:48px;margin:0 auto 12px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
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
    const perPage = ref(20);
    const search = ref('');
    const showModal = ref(false);
    const editingRecord = ref(null);
    const viewingRecord = ref(null);
    const formData = ref({});
    const saving = ref(false);
    const selectedIds = ref(new Set());
    const showBatchPanel = ref(false);
    const batchField = ref('');
    const batchValue = ref('');
    let searchTimer = null;

    // 排序
    const sortField = ref('');
    const sortOrder = ref('desc');
    // 列筛选
    const colFilters = ref({});

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
    const galleryField = ref('');
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

    function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page.value = 1; selectedIds.value.clear(); loadRecords(); }, 300); }
    function toggleSort(field) { if (sortField.value === field) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'; else { sortField.value = field; sortOrder.value = 'desc'; } page.value = 1; selectedIds.value.clear(); loadRecords(); }
    function toggleSelectAll() { if (selectedIds.value.size === records.value.length) { selectedIds.value.clear(); } else { records.value.forEach(r => selectedIds.value.add(r.id)); } }
    function toggleSelect(id) { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); }
    function clearSelection() { selectedIds.value.clear(); showBatchPanel.value = false; }
    async function batchDelete() { showConfirm.value = { msg: `确认删除选中的 ${selectedIds.value.size} 条记录？`, action: () => api.post(`/tables/${props.tableId}/records/batch`, { action: 'delete', ids: [...selectedIds.value] }).then(() => { showToast(`已删除 ${selectedIds.value.size} 条`, 'success'); clearSelection(); loadRecords(); }).catch(e => showToast('批量删除失败', 'error')) } }
    async function batchUpdateField() { if (!batchField.value || !batchValue.value) return; try { for (const id of selectedIds.value) { await api.put(`/records/${id}`, { data: { [batchField.value]: batchValue.value } }); } showToast(`已更新 ${selectedIds.value.size} 条`, 'success'); clearSelection(); loadRecords(); } catch (e) { showToast('批量更新失败', 'error'); } }

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
        const res = await api.get(`/tables/${props.tableId}/records`, { params: { page: page.value, per_page: perPage.value, search: search.value, sort: sortField.value, order: sortOrder.value } });
        records.value = res.data.records; total.value = res.data.total; pages.value = res.data.pages;
      } catch (e) { showToast('加载失败', 'error'); }
    }

    function viewRecord(r) { viewingRecord.value = r; }
    function openAdd() { editingRecord.value = null; formData.value = {}; showModal.value = true; }
    function editRecord(r) { editingRecord.value = r; formData.value = JSON.parse(JSON.stringify(r.data)); showModal.value = true; }

    async function saveRecord() {
      const fields = table.value.fields || [];
      const errors = [];
      for (const f of fields) {
        const val = formData.value[f.name];
        // 必填检查
        if (f.required && (val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length))) {
          errors.push(`「${f.name}」为必填项`);
          continue;
        }
        if (val === undefined || val === null || val === '') continue;
        // 格式校验
        let pattern = '';
        if (f.pattern === 'custom') pattern = f.customPattern;
        else if (f.pattern === 'phone') pattern = '^1[3-9]\d{9}$';
        else if (f.pattern === 'email') pattern = '^[^\s@]+@[^\s@]+\.[^\s@]+$';
        else if (f.pattern === 'url') pattern = '^https?://[^\s]+$';
        else if (f.pattern === 'idcard') pattern = '^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$';
        if (pattern) { try { if (!new RegExp(pattern).test(String(val))) errors.push(`「${f.name}」格式不正确`); } catch {} }
      }
      if (errors.length) { showToast(errors[0], 'error'); saving.value = false; return; }
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
      } else if (mode === 'gallery') {
        loadGallery();
      }
    }

    function getTitleField() {
      if (galleryField.value) return galleryField.value;
      const txt = table.value?.fields?.find(f => f.type === 'text');
      return txt?.name || '';
    }
    function getSelectColor(r) {
      const sel = table.value?.fields?.find(f => f.type === 'select');
      if (!sel) return null;
      const val = r.data[sel.name];
      if (!val) return null;
      const opts = sel.options || [];
      const idx = opts.indexOf(val);
      const colors = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];
      return colors[idx % colors.length];
    }
    function galleryShowFields(r) {
      const fields = table.value?.fields || [];
      const title = getTitleField();
      return fields.filter(f => {
        if (f.name === title) return false;
        const val = r.data[f.name];
        return val !== undefined && val !== null && val !== '';
      }).slice(0, 4);
    }
    async function loadGallery() {
      if (viewMode.value !== 'gallery') return;
      await loadRecords();
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
    async function deleteForm(f) { showConfirm.value = { msg: `删除表单「${f.name}」？`, action: () => api.delete(`/forms/${f.id}`).then(() => { loadForms(); showToast('已删除', 'success'); }).catch(e => showToast('删除失败', 'error')) } }
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
      table, records, total, pages, page, perPage, search, showModal, editingRecord, viewingRecord, formData, saving,
      selectedIds, showBatchPanel, batchField, batchValue, sortField, sortOrder,
      viewMode, kanbanGroupBy, kanbanColumns, kanbanFields, draggingId, dragOverColumn,
      calDateField, calYear, calMonth, calCells, calDateFields, calEventColors,
      showFormsPanel, forms, savingForm, newForm,
      showImport, importStep, importData, importHeaders, fieldMap, importError, importing, importedCount, importFailed, dragOver,
      debounceSearch, debounceFilter, getRecordTitle, loadRecords, viewRecord, openAdd, editRecord, saveRecord, deleteRecord, closeModal, goBack,
      toggleSort, toggleSelectAll, toggleSelect, clearSelection, batchDelete, batchUpdateField,
      switchView, loadKanban, kanbanDragStart, kanbanDragOver, kanbanDragLeave, kanbanDrop, openAddForColumn,
      calPrevMonth, calNextMonth, calToday, loadCalendar, openAddForDate,
      triggerImport, handleFileDrop, handleFileSelect, parseFile, doImport, downloadTemplate, exportCSV,
      loadForms, createForm, deleteForm, formPublicUrl, copyFormUrl,
      filters, filterField, toggleCol, hiddenCols, showColPanel,
      galleryField, getTitleField, getSelectColor, galleryShowFields, loadGallery,
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
      if (parts[0] === 'profile') return 'profile';
      if (parts[0] === 'users') return 'users';
      if (parts[0] === 'public' && parts[1] === 'form' && parts[2]) return { view: 'form-public', formKey: parts[2] };
      if (parts[0] === 'app') {
        if (parts[2] === 'table') return { view: 'table', appId: parts[1], tableId: parts[3] };
        return { view: 'app', appId: parts[1] };
      }
      return parts[0] || 'dashboard';
    }
    async function checkAuth() {
      const token = localStorage.getItem('lingda_token');
      const hash = location.hash.slice(1) || '';
      if (hash.startsWith('/public/form/')) { route.value = parseRoute(hash); return; }
      if (!token) { route.value = 'login'; return; }
      try {
        await api.get('/auth/me');
        route.value = parseRoute(hash || 'dashboard');
        if (route.value === 'login') route.value = 'dashboard';
      } catch { localStorage.removeItem('lingda_token'); route.value = 'login'; }
    }
    function navigate() {
      const hash = location.hash.slice(1) || 'dashboard';
      if (hash.startsWith('/public/form/')) { route.value = parseRoute(hash); return; }
      route.value = parseRoute(hash);
    }
    function navigateTo(view, id) { if (view === 'dashboard') { location.hash = '#dashboard'; } else if (view === 'app' && id) { location.hash = `#app/${id}`; } else if (view === 'profile') { location.hash = '#profile'; } else if (view === 'users') { location.hash = '#users'; } else if (view === 'appEmpty') { location.hash = '#app'; } }
    function logoutWithConfirm(msg) { showConfirm.value = { msg: msg || '确定退出登录？', ok: logout }; }
    function logout() { localStorage.removeItem('lingda_token'); location.hash = '#login'; location.reload(); }
    onMounted(async () => { await checkAuth(); window.addEventListener('hashchange', navigate); });
    const currentView = computed(() => typeof route.value === 'string' ? route.value : (route.value?.view || null));
    const routeParams = computed(() => typeof route.value === 'object' ? route.value : null);
    const currentUser = ref(null);
    async function loadUser() { try { const r = await api.get('/auth/me'); currentUser.value = r.data; } catch {} }
    const isAdmin = computed(() => currentUser.value?.is_admin);
    const showConfirm = ref(null);
    function confirmDialog(msg) { return new Promise(resolve => { showConfirm.value = { msg, action: () => { resolve(true); showConfirm.value = null; }, cancel: () => { resolve(false); showConfirm.value = null; } }; }); }
    function confirmOk() { const a = showConfirm.value?.action; showConfirm.value = null; if (a) a(); }
    function logoutWithConfirm() { showConfirm.value = { msg: '确定退出登录？', action: logout }; }
    function logoutWithConfirm() { showConfirm.value = { msg: '确定退出登录？', ok: logout }; }
    onMounted(async () => { await checkAuth(); if (route.value !== 'login') await loadUser(); window.addEventListener('hashchange', navigate); });
    return { view: route, currentView, routeParams, navigateTo, logout, logoutWithConfirm, currentUser, isAdmin, showConfirm, confirmDialog, confirmOk };
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
          <div class="sidebar-item" :class="{active: currentView==='dashboard'}" @click="navigateTo('dashboard')">
            <i class="pi pi-th-large"></i> 我的应用
          </div>
          <div v-if="isAdmin !== false" class="sidebar-item" :class="{active: currentView==='users'}" @click="navigateTo('users')" style="color:var(--accent)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>用户管理
          </div>
          <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
            <div class="sidebar-item" @click="logoutWithConfirm" style="color:var(--danger)">
              <i class="pi pi-sign-out"></i> 退出登录
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="topbar" style="display:flex;align-items:center;justify-content:space-between">
          <div class="topbar-title">{{ currentView === 'app' ? '应用详情' : currentView === 'table' ? '数据管理' : currentView === 'users' ? '用户管理' : '我的应用' }}</div>
          <div style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--text-secondary)" v-if="currentUser">
            <span>{{ currentUser.name }}</span>
            <span v-if="isAdmin" style="background:var(--accent);color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">管理员</span>
          </div>
        </div>
        <app-list v-if="currentView==='dashboard'" />
        <app-detail v-else-if="currentView==='app'" :appId="routeParams?.appId" :key="'app-'+routeParams?.appId" />
        <table-detail v-else-if="currentView==='table'" :appId="routeParams?.appId" :tableId="routeParams?.tableId" :key="'table-'+routeParams?.tableId" />
        <profile-page v-else-if="currentView==='profile'" />
        <user-management v-else-if="currentView==='users'" />
        <form-public-page v-else-if="currentView==='form-public'" :formKey="routeParams?.formKey" />
      </div>
      <!-- 自定义确认弹窗 -->
      <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm.value = null">
        <div style="background:var(--surface);border-radius:16px;padding:28px;max-width:360px;width:100%;text-align:center">
          <div style="width:48px;height:48px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#DC2626;font-size:24px;font-weight:700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p style="font-size:16px;font-weight:600;margin-bottom:24px">{{ showConfirm.msg }}</p>
          <div style="display:flex;gap:12px">
            <button @click="showConfirm.value = null" style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:10px;background:white;font-size:15px;font-weight:600;cursor:pointer">取消</button>
            <button @click="confirmOk()" style="flex:1;padding:12px;background:var(--danger);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">确定</button>
          </div>
        </div>
      </div>
      <!-- 手机底部导航 -->
      <nav class="mobile-nav">
        <div class="mobile-nav-item" :class="{active: currentView==='dashboard'}" @click="navigateTo('dashboard')">
          <i class="pi pi-th-large"></i>
          <span>应用</span>
        </div>
        <div class="mobile-nav-item" v-if="currentView!=='dashboard' && currentView!=='profile'" @click="navigateTo('app', routeParams?.appId)">
          <i class="pi pi-sitemap"></i>
          <span>数据表</span>
        </div>
        <div class="mobile-nav-item" :class="{active: currentView==='profile'}" @click="navigateTo('profile')">
          <i class="pi pi-user"></i>
          <span>我的</span>
        </div>
      </nav>
    </div>
  `,
  components: { AuthPage, AppList, AppDetail, TableDetail, ProfilePage, FormPublicPage, UserManagement }
};

const app = createApp(App);
app.mount('#app');
