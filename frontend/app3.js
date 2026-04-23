// 零搭 NoCode Platform - Frontend App
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

// API 基础 URL
const API_BASE = 'http://localhost:5000/api';

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
    if (window.location.hash !== '#login') window.location.hash = '#login';
  }
  return Promise.reject(err);
});

// 全局 location 辅助函数（兼容所有环境）

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
  { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>', label: '日程', bg: '#F3E8FF', color: '#7C3AED' },
  { icon: '¥', label: '财务', bg: '#FEE2E2', color: '#DC2626' },
  { icon: '◫', label: '库存', bg: '#FFEDD5', color: '#EA580C' },
  { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', label: '行政', bg: '#F1F5F9', color: '#64748B' },
  { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', label: '客服', bg: '#FCE7F3', color: '#DB2777' },
  { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>', label: '培训', bg: '#CCFBF1', color: '#0D9488' },
  { icon: '◁', label: '物流', bg: '#EDE9FE', color: '#9333EA' },
  { icon: '◧', label: '工具', bg: '#E2E8F0', color: '#475569' },
];

// ============ 认证页面 ============
const AuthPage = {
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>零搭</h1>
          <p>可视化管理系统构建平台</p>
        </div>
        <div class="auth-steps">
          <div class="auth-step" :class="{active: step==='login', done: step==='verify'||step==='reset'}">
            <div class="auth-step-num">1</div><div class="auth-step-label">账号</div>
          </div>
          <div class="auth-step-line"></div>
          <div class="auth-step" :class="{active: step==='verify'||step==='reset', done: step==='done'}">
            <div class="auth-step-num">2</div><div class="auth-step-label">验证</div>
          </div>
        </div>

        <!-- ===== 登录 ===== -->
        <form v-if="step==='login'" @submit.prevent="doLogin">
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" v-model="password" placeholder="输入密码" required>
          </div>
          <div style="text-align:right;margin-bottom:12px">
            <a href="#" @click.prevent="step='reset';resetEmail='';resetCode='';newPassword='';resetSent=false;error='';successMsg=''" style="font-size:13px;color:var(--primary);text-decoration:none">忘记密码？</a>
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <p style="text-align:center;margin-top:16px;font-size:14px;color:var(--text-secondary)">
            还没有账号？<a href="#" @click.prevent="step='register';error=''" style="color:var(--primary);text-decoration:none;font-weight:600">立即注册</a>
          </p>
        </form>

        <!-- ===== 注册 ===== -->
        <form v-else-if="step==='register'" @submit.prevent="doRegister">
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" v-model="password" placeholder="至少6位" required minlength="6">
          </div>
          <div class="form-group">
            <label>昵称（选填）</label>
            <input type="text" v-model="name" placeholder="你怎么称呼">
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '发送中...' : '注册并验证邮箱' }}
          </button>
          <p v-if="error" style="color:var(--danger);font-size:13px;text-align:center;margin-top:8px">{{ error }}</p>
          <p style="text-align:center;margin-top:16px;font-size:14px;color:var(--text-secondary)">
            已有账号？<a href="#" @click.prevent="step='login';error=''" style="color:var(--primary);text-decoration:none;font-weight:600">直接登录</a>
          </p>
        </form>

        <!-- ===== 验证邮箱 ===== -->
        <form v-else-if="step==='verify'" @submit.prevent="doVerify">
          <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:40px;margin-bottom:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <p style="color:var(--text);font-size:15px;font-weight:600;margin:0 0 8px">验证您的邮箱</p>
            <p style="color:var(--text-secondary);font-size:13px;margin:0">验证码已发送至</p>
            <p style="color:var(--primary);font-weight:700;font-size:15px;margin:4px 0 0">{{ pendingEmail }}</p>
          </div>
          <div class="form-group">
            <label>验证码</label>
            <input type="text" v-model="verifyCode" placeholder="请输入6位数字验证码" maxlength="6" required style="letter-spacing:4px;font-size:18px;text-align:center">
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading || verifyCode.length!==6">
            {{ loading ? '验证中...' : '验证并登录' }}
          </button>
          <p v-if="error" style="color:var(--danger);font-size:13px;text-align:center;margin-top:8px">{{ error }}</p>
          <div style="text-align:center;margin-top:16px">
            <span style="color:var(--text-secondary);font-size:13px">没收到？</span>
            <button type="button" @click="resendCode" :disabled="resendCd>0" style="background:none;border:none;color:var(--primary);font-size:13px;cursor:pointer;font-weight:600">
              {{ resendCd > 0 ? resendCd+'秒后可重发' : '重新发送验证码' }}
            </button>
          </div>
          <p style="text-align:center;margin-top:8px">
            <a href="#" @click.prevent="step='register';verifyCode=''" style="font-size:13px;color:var(--text-secondary);text-decoration:none">← 返回注册</a>
          </p>
        </form>

        <!-- ===== 密码重置 ===== -->
        <form v-else-if="step==='reset'" @submit.prevent="doReset">
          <div v-if="!resetSent">
            <div style="text-align:center;margin-bottom:20px">
              <div style="font-size:40px;margin-bottom:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg></div>
              <p style="color:var(--text);font-size:15px;font-weight:600;margin:0 0 8px">重置密码</p>
              <p style="color:var(--text-secondary);font-size:13px;margin:0">输入您注册的邮箱，我们会发送验证码</p>
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input type="email" v-model="resetEmail" placeholder="your@email.com" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
              {{ loading ? '发送中...' : '发送验证码' }}
            </button>
          </div>
          <div v-else>
            <div style="text-align:center;margin-bottom:20px">
              <div style="font-size:40px;margin-bottom:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
              <p style="color:var(--text);font-size:15px;font-weight:600;margin:0 0 8px">输入验证码</p>
              <p style="color:var(--text-secondary);font-size:13px;margin:0">验证码已发送至 {{ resetEmail }}</p>
            </div>
            <div class="form-group">
              <label>验证码</label>
              <input type="text" v-model="resetCode" placeholder="6位验证码" maxlength="6" required style="letter-spacing:4px;font-size:18px;text-align:center">
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input type="password" v-model="newPassword" placeholder="至少6位" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-block" :disabled="loading || resetCode.length!==6 || newPassword.length<6">
              {{ loading ? '重置中...' : '确认重置密码' }}
            </button>
          </div>
          <p v-if="error" style="color:var(--danger);font-size:13px;text-align:center;margin-top:8px">{{ error }}</p>
          <p v-if="successMsg" style="color:var(--accent);font-size:13px;text-align:center;margin-top:8px;font-weight:600">{{ successMsg }}</p>
          <p style="text-align:center;margin-top:12px">
            <a href="#" @click.prevent="step='login';resetSent=false;resetCode='';error='';successMsg=''" style="font-size:13px;color:var(--text-secondary);text-decoration:none">← 返回登录</a>
          </p>
        </form>

        <!-- ===== 成功 ===== -->
        <div v-else-if="step==='done'" style="text-align:center;padding:20px 0">
          <div style="font-size:56px;margin-bottom:16px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79M4 3h.01M8 7h4m4 0h.01M11 11h.01M20.7 3a9 9 0 0 1 0 13.3"/><path d="M14 3a9 9 0 0 1-2.6 5.5L20 22"/></svg></div>
          <h3 style="color:var(--text);margin:0 0 8px">{{ successMsg }}</h3>
          <p style="color:var(--text-secondary);font-size:14px;margin:0 0 24px">即将跳转...</p>
        </div>

      </div>
    </div>
  `,
  setup() {
    const step = ref('login');
    const email = ref('');
    const password = ref('');
    const name = ref('');
    const loading = ref(false);
    const error = ref('');
    const successMsg = ref('');
    const verifyCode = ref('');
    const pendingEmail = ref('');
    const resendCd = ref(0);
    const resetEmail = ref('');
    const resetSent = ref(false);
    const resetCode = ref('');
    const newPassword = ref('');
    let cdTimer = null;

    function showErr(m) { error.value = m; successMsg.value = ''; }
    function showOk(m) { successMsg.value = m; error.value = ''; }

    async function doLogin() {
      loading.value = true; error.value = '';
      try {
        const res = await api.post('/auth/login', { email: email.value, password: password.value });
        localStorage.setItem('lingda_token', res.data.token);
        window.location.hash = '#dashboard';
        window.location.reload();
      } catch (e) {
        const d = e.response?.data;
        if (d?.need_verify) { pendingEmail.value = email.value; step.value = 'verify'; startCd(); }
        else { showErr(d?.error || '登录失败'); }
      } finally { loading.value = false; }
    }

    async function doRegister() {
      if (!email.value || !password.value) { showErr('请填写邮箱和密码'); return; }
      loading.value = true; error.value = '';
      try {
        await api.post('/auth/register', { email: email.value, password: password.value, name: name.value });
        pendingEmail.value = email.value; step.value = 'verify';
        showOk('验证码已发送，请查收邮件'); startCd();
      } catch (e) { showErr(e.response?.data?.error || '注册失败'); }
      finally { loading.value = false; }
    }

    async function doVerify() {
      if (verifyCode.value.length !== 6) { showErr('请输入6位验证码'); return; }
      loading.value = true; error.value = '';
      try {
        const res = await api.post('/auth/verify-email', { email: pendingEmail.value, code: verifyCode.value });
        localStorage.setItem('lingda_token', res.data.token);
        showOk('验证成功，欢迎加入零搭！'); step.value = 'done';
        setTimeout(() => { window.location.hash = '#dashboard'; window.location.reload(); }, 1500);
      } catch (e) { showErr(e.response?.data?.error || '验证失败'); }
      finally { loading.value = false; }
    }

    async function resendCode() {
      if (resendCd.value > 0) return;
      try {
        await api.post('/auth/resend-verify', { email: pendingEmail.value });
        showOk('验证码已重新发送'); startCd();
      } catch (e) { showErr(e.response?.data?.error || '发送失败'); }
    }

    async function doReset() {
      error.value = ''; successMsg.value = '';
      if (!resetSent.value) {
        loading.value = true;
        try {
          await api.post('/auth/send-reset-code', { email: resetEmail.value });
          resetSent.value = true; showOk('验证码已发送，请查收邮件'); startCd();
        } catch (e) { showErr(e.response?.data?.error || '发送失败'); }
        finally { loading.value = false; }
      } else {
        if (resetCode.value.length !== 6) { showErr('请输入6位验证码'); return; }
        if (newPassword.value.length < 6) { showErr('新密码至少6位'); return; }
        loading.value = true;
        try {
          await api.post('/auth/reset-password', { email: resetEmail.value, code: resetCode.value, new_password: newPassword.value });
          showOk('密码重置成功！'); step.value = 'done';
          setTimeout(() => { step.value = 'login'; resetSent.value = false; resetCode.value = ''; newPassword.value = ''; }, 2000);
        } catch (e) { showErr(e.response?.data?.error || '重置失败'); }
        finally { loading.value = false; }
      }
    }

    function startCd() {
      resendCd.value = 60;
      if (cdTimer) clearInterval(cdTimer);
      cdTimer = setInterval(() => { resendCd.value--; if (resendCd.value <= 0) { clearInterval(cdTimer); cdTimer = null; } }, 1000);
    }

    return {
      step, email, password, name, loading, error, successMsg,
      verifyCode, pendingEmail, resendCd,
      resetEmail, resetSent, resetCode, newPassword,
      doLogin, doRegister, doVerify, resendCode, doReset,
    };
  }
};

// ============ 应用列表 ============
const AppList = {
  template: `
    <div class="page-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:800">我的应用</h2>
        <button class="btn btn-primary" @click="showCreate = true">+ 新建应用</button>
      </div>
      <div class="app-grid">
        <div v-for="app in apps" :key="app.id" style="position:relative">
          <div class="app-card" @click="goApp(app)">
            <div class="app-card-icon" :style="{background:ICON_OPTIONS.find(o=>o.icon===app.icon)?.bg||'#EEF2FF',color:ICON_OPTIONS.find(o=>o.icon===app.icon)?.color||'#4F46E5'}">{{ app.icon||'▤' }}</div>
            <div class="app-card-name">{{ app.name }}</div>
            <div class="app-card-desc">{{ app.description||'暂无描述' }}</div>
            <div class="app-card-meta">{{ app.table_count }} 个数据表</div>
          </div>
          <button @click="delApp(app)" title="删除" style="position:absolute;top:8px;right:8px;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1.5px solid #FECACA;border-radius:50%;cursor:pointer;color:#DC2626;font-size:14px;line-height:26px;text-align:center;padding:0">×</button>
        </div>
        <div class="new-app-card" @click="showCreate = true">
          <span>+ 创建新应用</span>
        </div>
      </div>

      <!-- 新建应用弹窗 -->
      <div class="modal-overlay" v-if="showCreate" @click.self="showCreate = false">
        <div class="modal" style="max-width:480px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h3 style="font-size:17px;font-weight:700">新建应用</h3>
            <button @click="showCreate = false" style="background:none;border:none;font-size:22px;cursor:pointer;padding:0">×</button>
          </div>
          <div class="form-group">
            <label style="font-weight:600;margin-bottom:6px;display:block">应用名称</label>
            <input v-model="newApp.name" placeholder="如：客户管理系统" required autofocus style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
          </div>
          <div class="form-group">
            <label style="font-weight:600;margin-bottom:8px;display:block">选择图标</label>
            <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:8px">
              <div v-for="opt in ICON_OPTIONS" :key="opt.icon"
                @click="newApp.icon = opt.icon"
                :style="newApp.icon===opt.icon?'border-color:'+opt.color+';background:'+opt.bg:'border-color:var(--border)'"
                style="padding:10px 4px;border-radius:10px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.15s">
                <div style="font-size:22px;margin-bottom:2px;color:#333">{{ opt.icon }}</div>
                <div style="font-size:10px;color:var(--text-secondary)">{{ opt.label }}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:13px;color:var(--text-secondary)">自定义：</span>
              <button @click="showPicker = true" style="padding:6px 14px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">选择更多</button>
              <span style="display:inline-block;padding:4px 12px;background:#EEF2FF;border-radius:8px;font-size:18px">{{ newApp.icon }}</span>
            </div>
          </div>
          <div class="form-group">
            <label style="font-weight:600;margin-bottom:6px;display:block">描述（选填）</label>
            <textarea v-model="newApp.description" placeholder="简单描述..." rows="2" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;resize:none;font-size:15px;outline:none"></textarea>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary" @click="showCreate=false">取消</button>
            <button class="btn btn-primary" @click="doCreate" :disabled="creating">{{ creating?'创建中...':'创建应用' }}</button>
          </div>
        </div>
      </div>

      <!-- 图标选择器 -->
      <div class="modal-overlay" v-if="showPicker" @click.self="showPicker=false">
        <div class="modal" style="max-width:360px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h3 style="font-size:16px;font-weight:700">选择更多图标</h3>
            <button @click="showPicker=false" style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px">×</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-height:36vh;overflow-y:auto;margin-bottom:10px">
            <div v-for="ic in extraIcons" :key="ic"
              @click="newApp.icon=ic;showPicker=false"
              :style="newApp.icon===ic?'border-color:var(--primary);background:var(--primary-light)':''"
              style="padding:10px 6px;text-align:center;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-size:22px;transition:all 0.15s">
              {{ ic }}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:13px;color:var(--text-secondary);flex-shrink:0">自定义：</span>
            <input v-model="newApp.icon" maxlength="4" placeholder="图标" style="flex:1;min-width:0;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:18px;outline:none;text-align:center;letter-spacing:2px">
            <button @click="newApp.icon = newApp.icon.trim() || '▤';showPicker=false" style="padding:7px 14px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;flex-shrink:0">确定</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const apps = ref([]);
    const showCreate = ref(false);
    const showPicker = ref(false);
    const newApp = ref({ name: '', icon: '▤', description: '' });
    const isCustomIcon = computed(() => !ICON_OPTIONS.find(o => o.icon === newApp.value.icon));
    const extraIcons = computed(() => ICON_LIST.filter(ic => !ICON_OPTIONS.find(o => o.icon === ic)));
    const creating = ref(false);
    const ICON_OPTIONS = [
      {icon:'▤',label:'文档',bg:'#EEF2FF',color:'#4F46E5'},
      {icon:'⊕',label:'客户',bg:'#E0F2FE',color:'#0891B2'},
      {icon:'≡',label:'数据',bg:'#D1FAE5',color:'#059669'},
      {icon:'◫',label:'项目',bg:'#FEF3C7',color:'#D97706'},
      {icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>',label:'日程',bg:'#F3E8FF',color:'#7C3AED'},
      {icon:'¥',label:'财务',bg:'#FEE2E2',color:'#DC2626'},
      {icon:'▣',label:'库存',bg:'#FFEDD5',color:'#EA580C'},
      {icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',label:'行政',bg:'#F1F5F9',color:'#64748B'},
      {icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',label:'客服',bg:'#FCE7F3',color:'#DB2777'},
      {icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',label:'培训',bg:'#CCFBF1',color:'#0D9488'},
      {icon:'◁',label:'物流',bg:'#EDE9FE',color:'#9333EA'},
      {icon:'◧',label:'工具',bg:'#E2E8F0',color:'#475569'},
    ];
    const ICON_LIST = '▤⊕▊◫<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>¥<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>◁<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>◈⬡<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>◎⬢<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>◆▣'.split('');

    async function load() {
      try { const r = await api.get('/apps'); apps.value = r.data; }
      catch (e) { showToast('加载失败','error'); }
    }
    function goApp(app) { window.location.hash = '#app/'+app.id; }
    async function delApp(app) {
      if (!confirm('确定删除应用"'+app.name+'"？所有数据将被永久删除！')) return;
      try { await api.delete('/apps/'+app.id); apps.value = apps.value.filter(x=>x.id!==app.id); showToast('已删除','success'); }
      catch (e) { showToast('删除失败','error'); }
    }
    async function doCreate() {
      if (!newApp.value.name.trim()) { showToast('请输入名称','error'); return; }
      creating.value = true;
      try {
        const r = await api.post('/apps', {name:newApp.value.name, icon:newApp.value.icon||'▤', description:newApp.value.description});
        apps.value.unshift(r.data);
        showCreate.value = false;
        newApp.value = {name:'',icon:'▤',description:''};
        showToast('创建成功','success');
        goApp(r.data);
      } catch (e) { showToast(e.response?.data?.error||'创建失败','error'); }
      finally { creating.value = false; }
    }
    onMounted(load);
    return { apps, showCreate, showPicker, newApp, creating, ICON_OPTIONS, ICON_LIST, extraIcons, goApp, delApp, doCreate, isCustomIcon };
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
          <button class="btn btn-primary" @click="openBuilder" style="font-size:14px;padding:10px 18px;">
            <span style="font-size:18px;line-height:1;font-weight:700">+</span> 添加数据表
          </button>
          <button class="btn btn-secondary" @click="showMembers=true" style="font-size:14px;padding:10px 18px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> 成员
          </button>
        </div>
      </div>

      <!-- 成员管理弹窗 -->
      <div class="modal-overlay" v-if="showMembers" @click.self="showMembers=false">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <div class="modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> 应用成员</div>
            <button class="modal-close" @click="showMembers=false">×</button>
          </div>
          <!-- 邀请新成员 -->
          <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
            <input v-model="inviteEmail" placeholder="输入邮箱邀请成员" style="flex:1;min-width:180px;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">
            <select v-model="inviteRole" style="padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none;background:var(--surface)">
              <option value="viewer">查看者</option>
              <option value="editor">编辑者</option>
            </select>
            <button @click="inviteMember" :disabled="inviting || !inviteEmail" class="btn btn-primary" style="padding:10px 18px">
              {{ inviting ? '邀请中...' : '邀请' }}
            </button>
          </div>
          <p v-if="inviteMsg" :style="inviteError ? 'color:var(--danger)' : 'color:var(--accent)'" style="font-size:13px;margin-bottom:16px;text-align:center">{{ inviteMsg }}</p>
          <!-- 成员列表 -->
          <div style="max-height:360px;overflow-y:auto">
            <div v-for="m in members" :key="m.id || 'owner'" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg);border-radius:12px;margin-bottom:8px;border:1.5px solid var(--border)">
              <div :style="m.role==='owner' ? 'width:40px;height:40px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px' : 'width:40px;height:40px;background:var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:var(--text-secondary)'">{{ (m.user_name || m.user_email || '?')[0].toUpperCase() }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14px">{{ m.user_name || '未知用户' }}</div>
                <div style="font-size:12px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ m.user_email }}</div>
              </div>
              <div v-if="m.role==='owner'" style="padding:4px 12px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;border-radius:20px;font-size:12px;font-weight:600">所有者</div>
              <select v-else v-model="m.role" @change="updateRole(m)" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;background:var(--surface)">
                <option value="editor">编辑者</option>
                <option value="viewer">查看者</option>
              </select>
              <button v-if="m.role!=='owner'" @click="removeMember(m)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:18px;padding:4px">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据表列表 -->
      <div v-if="tables.length">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          <div class="table-item" v-for="t in tables" :key="t.id" @click="openTable(t)" style="cursor:pointer">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;flex-shrink:0;box-shadow:0 2px 8px rgba(79,70,229,0.3)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:15px;margin-bottom:4px">{{ t.name }}</div>
              <div style="font-size:12px;color:var(--text-secondary)">{{ t.record_count }} 条记录 · {{ t.fields?.length || 0 }} 个字段</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button @click.stop="editTable(t)" style="background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;cursor:pointer;font-size:13px;transition:all 0.15s" onmouseover="this.style.borderColor='var(--primary)',this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)',this.style.color='var(--text)'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>️ 编辑</button>
              <button @click.stop="deleteTable(t)" style="background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;cursor:pointer;font-size:13px;color:var(--danger);transition:all 0.15s" onmouseover="this.style.borderColor='var(--danger)',this.style.background='#FEF2F2'" onmouseout="this.style.borderColor='var(--border)',this.style.background='var(--bg)'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>️ 删除</button>
            </div>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div style="font-size:56px;margin-bottom:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>️</div>
        <h3>还没有数据表</h3>
        <p>点击上方按钮添加第一个数据表<br>或使用下方的可视化构建器</p>
        <button class="btn btn-primary" @click="openBuilder" style="margin-top:16px">
          <i class="<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>"></i> 可视化构建器
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
    // 成员管理
    const showMembers = ref(false);
    const members = ref([]);
    const inviteEmail = ref('');
    const inviteRole = ref('viewer');
    const inviting = ref(false);
    const inviteMsg = ref('');
    const inviteError = ref(false);
    const fieldTypes = [
      { value: 'text', label: '文本', icon: 'T' },
      { value: 'number', label: '数字', icon: '#' },
      { value: 'select', label: '下拉', icon: '▼' },
      { value: 'checkbox', label: '复选', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>' },
      { value: 'date', label: '日期', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
      { value: 'textarea', label: '多行', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' },
      { value: 'phone', label: '电话', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 10.5 19.79 19.79 0 0 1 1.61 1.9 2 2 0 0 1 3.6 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.97-.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
      { value: 'email', label: '邮箱', icon: '@' },
      { value: 'url', label: '链接', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
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
    function openTable(t) { window.location.hash = `#app/${props.appId}/table/${t.id}`; }
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

    // 成员管理
    async function loadMembers() {
      try {
        const res = await api.get(`/apps/${props.appId}/members`);
        members.value = res.data;
      } catch (e) { showToast('加载成员失败', 'error'); }
    }
    async function inviteMember() {
      if (!inviteEmail.value) return;
      inviting.value = true; inviteMsg.value = '';
      try {
        await api.post(`/apps/${props.appId}/members`, { email: inviteEmail.value, role: inviteRole.value });
        inviteMsg.value = '邀请成功'; inviteError.value = false;
        inviteEmail.value = '';
        await loadMembers();
      } catch (e) {
        inviteMsg.value = e.response?.data?.error || '邀请失败'; inviteError.value = true;
      } finally { inviting.value = false; }
    }
    async function updateRole(m) {
      if (m.role === 'owner') return;
      try {
        await api.put(`/apps/${props.appId}/members/${m.id}`, { role: m.role });
        showToast('权限已更新', 'success');
      } catch (e) { showToast('更新失败', 'error'); loadMembers(); }
    }
    async function removeMember(m) {
      if (!confirm(`移除成员 ${m.user_name || m.user_email}？`)) return;
      try {
        await api.delete(`/apps/${props.appId}/members/${m.id}`);
        members.value = members.value.filter(x => x.id !== m.id);
        showToast('已移除', 'success');
      } catch (e) { showToast('移除失败', 'error'); }
    }
    // 点击成员按钮时加载成员列表
    watch(showMembers, (val) => { if (val) loadMembers(); });

    return { app, tables, showBuilder, editingTable, tableForm, saving, fieldTypes, hoverStyle, openTable, openBuilder, editTable, deleteTable, addField, removeField, toggleRequired, fieldTypeLabel, addOption, ensureOption, syncSlug, saveTable, goBack, showMembers, members, inviteEmail, inviteRole, inviting, inviteMsg, inviteError, inviteMember, updateRole, removeMember };
  }
};

// ============ 数据表详情 ============
const TableDetail = {
  props: ['appId', 'tableId'],
  template: `
    <div class="page-content">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="btn btn-secondary" @click="goBack" style="padding:8px 14px;border-radius:10px">
          ←
        </button>
        <div>
          <h2 style="font-size:18px;font-weight:800;">{{ table.name }}</h2>
          <div style="font-size:13px;color:var(--text-secondary);">{{ table.fields?.length || 0 }} 个字段 · {{ total }} 条记录</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <!-- 视图切换 -->
          <div style="display:flex;background:var(--bg);border-radius:10px;padding:3px;border:1.5px solid var(--border);gap:2px">
            <button @click="switchView('table')" :style="viewMode==='table'?'background:var(--primary);color:white;border-radius:8px':'color:var(--primary);background:var(--primary-light);border-radius:8px'" style="padding:6px 14px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 表格</button>
            <button @click="switchView('kanban')" :style="viewMode==='kanban'?'background:var(--primary);color:white;border-radius:8px':'color:var(--primary);background:var(--primary-light);border-radius:8px'" style="padding:6px 14px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> 看板</button>
            <button @click="switchView('calendar')" :style="viewMode==='calendar'?'background:var(--primary);color:white;border-radius:8px':'color:var(--primary);background:var(--primary-light);border-radius:8px'" style="padding:6px 14px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 日历</button>
          </div>
          <button class="btn btn-secondary" @click="showFormsPanel=!showFormsPanel"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 表单</button>
          <button class="btn btn-secondary" @click="showFieldEditor=!showFieldEditor"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>️ 编辑字段</button>
          <button class="btn btn-secondary" @click="triggerImport"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> 导入</button>
          <button class="btn btn-secondary" @click="exportCSV"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> 导出</button>
          <button class="btn btn-primary" @click="openAdd" style="font-size:14px;padding:10px 18px">
            <span style="font-size:18px;line-height:1;font-weight:700">+</span> 添加记录
          </button>
        </div>
      </div>

      <!-- CSV导入弹窗 -->
      <div class="modal-overlay" v-if="showImport" @click.self="showImport=false">
        <div class="modal" style="max-width:640px">
          <div class="modal-header">
            <div class="modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> 导入 CSV 数据</div>
            <button class="modal-close" @click="showImport=false">×</button>
          </div>
          <div v-if="!importStep || importStep==='upload'">
            <p style="color:var(--text-secondary);font-size:13px;margin:0 0 16px">请上传 CSV 文件（第一行应为字段名，建议用 UTF-8 编码）</p>
            <div style="border:2px dashed var(--border);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.15s" :style="dragOver?{borderColor:'var(--primary)',background:'var(--primary-light)'}:{borderColor:'var(--border)'}" @click="$refs.fileInput.click()" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="handleFileDrop">
              <div style="font-size:40px;margin-bottom:12px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
              <p style="font-weight:600;color:var(--text);margin:0 0 4px">点击选择 CSV 文件</p>
              <p style="font-size:13px;color:var(--text-secondary);margin:0">或将文件拖到此处</p>
            </div>
            <input ref="fileInput" type="file" accept=".csv,.txt" style="display:none" @change="handleFileSelect">
            <p v-if="importError" style="color:var(--danger);font-size:13px;margin-top:8px;text-align:center">{{ importError }}</p>
            <div style="display:flex;gap:12px;margin-top:16px">
              <button class="btn btn-secondary" @click="showImport=false">取消</button>
              <button class="btn btn-secondary" @click="downloadTemplate" style="flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> 下载字段模板</button>
            </div>
          </div>
          <div v-else-if="importStep==='preview'">
            <p style="font-size:14px;margin:0 0 12px">
              共 <strong style="color:var(--primary)">{{ importData.length }}</strong> 条数据，待导入到「{{ table.name }}」
            </p>
            <div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-bottom:12px">
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="background:var(--bg)">
                    <th v-for="h in importHeaders" :key="h" style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:1px solid var(--border);white-space:nowrap">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row,i) in importData.slice(0,20)" :key="i">
                    <td v-for="h in importHeaders" :key="h" style="padding:8px 12px;border-bottom:1px solid var(--border);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ row[h] }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="importData.length>20" style="padding:12px;text-align:center;color:var(--text-secondary);font-size:13px">
                还有 {{ importData.length-20 }} 条数据...
              </div>
            </div>
            <!-- 字段映射 -->
            <div style="margin-bottom:12px">
              <label style="font-weight:600;font-size:13px;display:block;margin-bottom:8px">字段映射（CSV列 → 数据表字段）</label>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <div v-for="h in importHeaders" :key="h" style="display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12px">
                  <span style="font-weight:600;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ h }}</span>
                  <span style="color:var(--text-secondary)">→</span>
                  <select v-model="fieldMap[h]" style="border:none;background:transparent;font-size:12px;outline:none;color:var(--primary);font-weight:600;cursor:pointer">
                    <option value="">忽略</option>
                    <option v-for="f in table.fields" :key="f.name" :value="f.name">{{ f.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:12px">
              <button class="btn btn-secondary" @click="importStep='upload';importData=[];importHeaders=[];fieldMap={}">← 重新选择</button>
              <button class="btn btn-primary" @click="doImport" :disabled="importing" style="flex:1">
                {{ importing ? '导入中...' : '确认导入 '+importData.length+' 条' }}
              </button>
            </div>
            <p v-if="importError" style="color:var(--danger);font-size:13px;margin-top:8px;text-align:center">{{ importError }}</p>
          </div>
          <div v-else-if="importStep==='done'">
            <div style="text-align:center;padding:20px 0">
              <div style="font-size:56px;margin-bottom:16px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <h3 style="margin:0 0 8px">导入完成！</h3>
              <p style="color:var(--text-secondary);margin:0">成功导入 <strong style="color:var(--primary)">{{ importedCount }}</strong> 条数据</p>
              <p v-if="importFailed>0" style="color:var(--danger);margin:8px 0 0">失败 {{ importFailed }} 条（格式错误）</p>
            </div>
            <div style="display:flex;gap:12px">
              <button class="btn btn-secondary" @click="showImport=false;importStep='upload'">继续导入</button>
              <button class="btn btn-primary" @click="showImport=false;loadRecords()" style="flex:1">好的，查看数据</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <template v-if="viewMode === 'table'">
        <!-- 搜索 -->
        <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="search-wrap">
            <input v-model="search" @input="debounceSearch" placeholder="搜索记录...">
          </div>
          <span class="record-count-badge">共 {{ total }} 条</span>
        </div>
        <!-- 表格（桌面） -->
        <div style="background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border);display:none" class="desktop-table">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
              <tr>
                <th v-for="f in table.fields" :key="f.name" style="padding:12px 16px;text-align:left;font-weight:700;font-size:13px;color:var(--text);border-bottom:1px solid var(--border);white-space:nowrap;background:var(--bg)">{{ f.name }}<span v-if="f.required" style="color:var(--danger)">*</span></th>
                <th style="padding:12px 16px;width:100px;background:var(--bg);border-bottom:1px solid var(--border)">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id" style="transition:background 0.1s">
                <td v-for="f in table.fields" :key="f.name" style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px">
                  <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg> 是' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> 否' }}</span></template>
                  <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 10px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                  <template v-else><span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">{{ r.data[f.name] || '—' }}</span></template>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                  <button @click="editRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--primary);font-size:13px;margin-right:8px">编辑</button>
                  <button @click="deleteRecord(r)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px">删除</button>
                </td>
              </tr>
              <tr v-if="!records.length"><td :colspan="(table.fields?.length||1)+1" style="text-align:center;padding:48px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12 12 20l-10-8V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6z"/><line x1="12" y1="20" x2="12" y2="12"/></svg></div>暂无数据</td></tr>
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
                <template v-if="f.type==='checkbox'"><span :style="r.data[f.name] ? 'color:var(--accent)' : 'color:var(--text-secondary)'">{{ r.data[f.name] ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' }} {{ r.data[f.name] ? '是' : '否' }}</span></template>
                <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:2px 8px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:12px;font-weight:600">{{ r.data[f.name] || '—' }}</span></template>
                <template v-else><span style="font-size:14px;font-weight:500">{{ r.data[f.name] || '—' }}</span></template>
              </div>
            </div>
          </div>
          <div v-if="!records.length" style="text-align:center;padding:40px;color:var(--text-secondary)"><div style="font-size:40px;margin-bottom:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12 12 20l-10-8V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6z"/><line x1="12" y1="20" x2="12" y2="12"/></svg></div>暂无数据，点击添加记录开始</div>
        </div>
        <!-- 分页 -->
        <div v-if="pages > 1" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;">
          <button class="btn btn-secondary" :disabled="page<=1" @click="page--;loadRecords()">上一页</button>
          <span style="font-size:14px">第 {{ page }} / {{ pages }} 页</span>
          <button class="btn btn-secondary" :disabled="page>=pages" @click="page++;loadRecords()">下一页</button>
        </div>
      </template>

      <!-- 看板视图 -->
      <template v-else-if="viewMode === 'kanban'">
        <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:14px;font-weight:600;color:var(--text-secondary)">分组字段：</span>
          <select v-model="kanbanGroupBy" @change="loadKanban" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:white;max-width:200px">
            <option value="">— 选择分组字段 —</option>
            <option v-for="f in kanbanFields" :key="f.name" :value="f.name">{{ f.name }} ({{ f.type }})</option>
          </select>
          <span style="font-size:13px;color:var(--text-secondary)">{{ total }} 条记录</span>
        </div>
        <div v-if="!kanbanGroupBy" style="text-align:center;padding:60px 20px;color:var(--text-secondary);border:2px dashed var(--border);border-radius:16px;">
          <div style="font-size:48px;margin-bottom:12px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg></div>
          <h3 style="margin-bottom:8px;color:var(--text)">选择分组字段</h3>
          <p>请选择上方下拉框中的字段（如下拉/状态）来开启看板视图</p>
        </div>
        <div v-else-if="kanbanColumns.length === 0" style="text-align:center;padding:60px 20px;color:var(--text-secondary);border:2px dashed var(--border);border-radius:16px;">
          <div style="font-size:48px;margin-bottom:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12 12 20l-10-8V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6z"/><line x1="12" y1="20" x2="12" y2="12"/></svg></div>
          <h3 style="margin-bottom:8px;color:var(--text)">暂无数据</h3>
          <p>添加记录后即可在看板中查看</p>
          <button class="btn btn-primary" @click="openAdd" style="margin-top:12px">添加第一条记录</button>
        </div>
        <div v-else style="display:flex;gap:16px;overflow-x:auto;padding-bottom:20px;align-items:flex-start;min-height:400px">
          <div v-for="col in kanbanColumns" :key="col.value"
            :style="dragOverColumn===col.value?'border-color:var(--primary);background:var(--primary-light)':'border-color:var(--border);background:var(--bg)'"
            style="min-width:280px;max-width:320px;flex-shrink:0;border-radius:14px;border:2px solid var(--border);display:flex;flex-direction:column;transition:all 0.15s"
            @dragover.prevent="kanbanDragOver(col.value)"
            @dragleave="kanbanDragLeave()"
            @drop="kanbanDrop(col.value)">
            <!-- 列头 -->
            <div :style="'padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:'+(col.color||'var(--primary)')+';border-radius:12px 12px 0 0'">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:10px;height:10px;border-radius:50%;background:rgba(0,0,0,0.3)"></div>
                <span :style="'font-weight:800;font-size:15px;color:'+((col.color==='#FEF08A'||col.color==='#FDE68A'||col.color==='#D9F99D'||col.color==='#A7F3D0'||col.color==='#FBCFE8'||col.color==='#FCA5A5')?'#1E293B':'white')">{{ col.value }}</span>
              </div>
              <span :style="'padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;backdrop-filter:blur(4px);background:rgba(0,0,0,0.2);color:'+((col.color==='#FEF08A'||col.color==='#FDE68A'||col.color==='#D9F99D'||col.color==='#A7F3D0'||col.color==='#FBCFE8'||col.color==='#FCA5A5')?'#1E293B':'white')">{{ col.records.length }}</span>
            </div>
            <!-- 卡片列表 -->
            <div style="padding:4px 12px 12px;flex:1;display:flex;flex-direction:column;gap:10px;min-height:80px;overflow-y:auto;max-height:calc(100vh - 320px)">
              <div v-for="r in col.records" :key="r.id"
                draggable="true"
                @dragstart="kanbanDragStart(r)"
                @click="editRecord(r)"
                style="background:white;border-radius:10px;padding:12px 14px;border:1.5px solid var(--border);cursor:grab;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.05)"
                :style="draggingId===r.id?'opacity:0.5;transform:rotate(2deg)':''">
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">#{{ r.id }}</div>
                <div v-for="f in table.fields.filter(x=>x.name!==kanbanGroupBy)" :key="f.name" style="margin-bottom:4px">
                  <div v-if="r.data[f.name]" style="display:flex;align-items:center;gap:6px;min-width:0">
                    <span style="font-size:12px;color:var(--text);font-weight:600;flex-shrink:0;width:50px">{{ f.name }}</span>
                    <template v-if="f.type==='checkbox'"><span :style="r.data[f.name]?'color:var(--accent)':'color:var(--text-secondary)'">{{ r.data[f.name]?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' }}</span></template>
                    <template v-else-if="f.type==='select'"><span style="display:inline-block;padding:1px 8px;background:var(--primary-light);color:var(--primary);border-radius:20px;font-size:11px;font-weight:600;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.data[f.name] }}</span></template>
                    <template v-else-if="f.type==='number'||f.type==='currency'"><span style="font-weight:700;font-size:13px">{{ f.type==='currency'?'¥':'' }}{{ r.data[f.name] }}</span></template>
                    <template v-else><span style="font-size:13px;font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">{{ r.data[f.name] }}</span></template>
                  </div>
                </div>
              </div>
              <!-- 添加卡片 -->
              <button @click.stop="openAddForColumn(col.value)" style="width:100%;padding:10px;border:2px dashed var(--border);border-radius:10px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:6px">
                <span style="font-size:16px">+</span> 添加到"{{ col.value }}"
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 日历视图 -->
      <template v-else-if="viewMode === 'calendar'">
        <div style="margin-bottom:16px">
          <select v-model="calDateField" @change="loadCalendar" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:white;max-width:200px;margin-right:12px">
            <option value="">选择日期字段</option>
            <option v-for="f in calDateFields" :key="f.name" :value="f.name">{{ f.name }}</option>
          </select>
          <button @click="calPrevMonth" style="padding:6px 12px;border:1.5px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:16px">‹</button>
          <span style="margin:0 16px;font-weight:700;font-size:16px;min-width:120px;display:inline-block;text-align:center">{{ calYear }}年 {{ calMonth+1 }}月</span>
          <button @click="calNextMonth" style="padding:6px 12px;border:1.5px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:16px">›</button>
          <button @click="calToday" style="padding:6px 12px;border:1.5px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;margin-left:8px">今天</button>
        </div>
        <div v-if="!calDateField" style="text-align:center;padding:60px 20px;color:var(--text-secondary);border:2px dashed var(--border);border-radius:16px;">
          <div style="font-size:56px;margin-bottom:16px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <p>请选择上方下拉框中的日期字段来开启日历视图</p>
        </div>
        <div v-else style="border:1.5px solid var(--border);border-radius:12px;overflow:hidden">
          <!-- 星期头 -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr);background:var(--bg-secondary);border-bottom:1.5px solid var(--border)">
            <div v-for="d in ['一','二','三','四','五','六','日']" :key="d" style="padding:10px 4px;text-align:center;font-weight:700;font-size:13px;color:var(--text-secondary)">{{ d }}</div>
          </div>
          <!-- 日期格子 -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr)">
            <div v-for="(cell,ci) in calCells" :key="ci"
              :style="{
                'min-height':'90px','border-right':'1px solid var(--border)','border-bottom':'1px solid var(--border)',
                'padding':'6px','background': cell.isToday?'rgba(79,70,229,0.05)': cell.isOtherMonth?'var(--bg-secondary)':'white',
                'opacity': cell.isOtherMonth ? 0.5 : 1
              }"
              :class="'cell' + (ci%7===6?' cell-sun':'') + (ci%7===5?' cell-sat':'')">
              <div style="font-size:13px;font-weight:600;margin-bottom:4px"
                :style="{'color': ci%7===6?'#DC2626': ci%7===5?'#059669':'var(--text-secondary)'}">{{ cell.day }}</div>
              <div v-for="ev in cell.events.slice(0,3)" :key="ev.id"
                @click="editRecord(ev)"
                style="font-size:11px;padding:2px 5px;border-radius:4px;margin-bottom:2px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                :style="{'background':ev._color||'#4F46E5','color':'white'}">{{ ev._label||'记录' }}</div>
              <div v-if="cell.events.length > 3" style="font-size:11px;color:var(--text-secondary);padding:2px 5px">+{{ cell.events.length-3 }} 更多</div>
              <button v-if="cell.dateStr" @click="openAddForDate(cell.dateStr)"
                style="margin-top:4px;width:100%;padding:3px;border:1px dashed var(--border);border-radius:6px;background:transparent;cursor:pointer;font-size:12px;opacity:0.6;color:var(--text-secondary)">+</button>
            </div>
          </div>
        </div>
      </template>

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
                <option value="">{{ (f.options||[]).length > 0 ? '请选择' : '请先在编辑字段中添加选项' }}</option>
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
      <!-- 表单管理面板 -->
      <div class="modal-overlay" v-if="showFormsPanel" @click.self="showFormsPanel=false">
        <div class="modal" style="max-width:640px">
          <div class="modal-header">
            <div class="modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 表单管理</div>
            <button class="modal-close" @click="showFormsPanel=false">×</button>
          </div>
          <div style="max-height:60vh;overflow-y:auto;padding:4px 0">
            <div v-if="forms.length === 0" style="text-align:center;padding:40px 20px;color:var(--text-secondary)">
              <p>还没有表单，创建一个吧</p>
            </div>
            <div v-for="f in forms" :key="f.id" style="padding:14px;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="font-weight:700;font-size:15px;flex:1">{{ f.name }}</span>
                <span :style="{'color':f.enabled?'var(--success)':'var(--text-secondary)','font-size':'12px'}">{{ f.enabled?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 启用':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> 停用' }}</span>
                <button @click="deleteForm(f)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:14px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">{{ f.description || '无描述' }}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                <span v-for="fn in f.allowed_fields" :key="fn" style="font-size:12px;padding:2px 8px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">{{ fn }}</span>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <input :value="formPublicUrl(f.form_key)" readonly onclick="this.select()"
                  style="flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:var(--bg)">
                <button @click="copyFormUrl(f.form_key)" class="btn btn-secondary" style="padding:8px 12px;font-size:12px">复制链接</button>
              </div>
            </div>
            <div style="padding:16px;border-top:1.5px solid var(--border);margin-top:4px">
              <div style="font-weight:700;margin-bottom:12px;font-size:14px">创建新表单</div>
              <div class="form-group">
                <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">表单名称</label>
                <input v-model="newForm.name" placeholder="如：客户反馈表单" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              </div>
              <div class="form-group">
                <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">描述（可选）</label>
                <input v-model="newForm.description" placeholder="表单用途说明" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:15px;outline:none">
              </div>
              <div class="form-group">
                <label style="display:block;margin-bottom:6px;font-weight:600;font-size:14px">允许提交的字段</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                  <label v-for="field in table.fields" :key="field.name" style="display:flex;align-items:center;gap:4px;font-size:13px;padding:4px 8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);cursor:pointer">
                    <input type="checkbox" :checked="newForm.allowed_fields.includes(field.name)" @change="toggleFormField(field.name)">
                    {{ field.name }}
                  </label>
                </div>
              </div>
              <button class="btn btn-primary" @click="createForm" :disabled="savingForm" style="margin-top:8px">
                {{ savingForm ? '创建中...' : '创建表单' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 字段编辑器弹窗 -->
      <div class="modal-overlay" v-if="showFieldEditor" @click.self="showFieldEditor=false">
        <div class="modal" style="max-width:600px">
          <div class="modal-header">
            <div class="modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>️ 编辑字段 - {{ table.name }}</div>
            <button class="modal-close" @click="showFieldEditor=false">×</button>
          </div>
          <div style="max-height:60vh;overflow-y:auto;padding:4px 0">
            <div style="padding:12px 0 8px;border-bottom:1.5px solid var(--border);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:var(--text-secondary)">共 {{ editingFields.length }} 个字段</span>
              <button @click="addNewField" style="padding:6px 14px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ 添加字段</button>
            </div>
            <div v-for="(f, i) in editingFields" :key="i" style="padding:12px 14px;background:var(--bg);border-radius:10px;margin-bottom:8px;border:1.5px solid var(--border)">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <input v-model="f.name" placeholder="字段名称" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:14px;outline:none">
                <select v-model="f.type" style="padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;outline:none;background:white">
                  <option value="text">文本</option>
                  <option value="number">数字</option>
                  <option value="select">下拉</option>
                  <option value="checkbox">复选</option>
                  <option value="date">日期</option>
                  <option value="textarea">多行文本</option>
                  <option value="currency">金额</option>
                  <option value="email">邮箱</option>
                  <option value="phone">电话</option>
                  <option value="url">链接</option>
                </select>
                <button @click="removeField(i)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:16px;padding:4px">×</button>
              </div>
              <div v-if="f.type==='select'" style="margin-top:8px">
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">下拉选项（点击输入框修改）：</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                  <div v-for="(opt, oi) in (f.options||[])" :key="oi" style="display:flex;align-items:center;gap:4px">
                    <input v-model="f.options[oi]" :placeholder="'选项'+(oi+1)"
                      style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;width:100px;outline:none">
                    <button @click="f.options.splice(oi,1)" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:14px;padding:2px">×</button>
                  </div>
                  <button @click="debugAddOpt(f)" style="padding:6px 12px;border:1.5px dashed var(--primary);border-radius:6px;background:var(--primary-light);cursor:pointer;font-size:13px;color:var(--primary);font-weight:600">+ 添加选项</button>
                </div>
              </div>
            </div>
            <div v-if="editingFields.length === 0" style="text-align:center;padding:40px;color:var(--text-secondary)">
              暂无字段，点击上方「添加字段」开始
            </div>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary" @click="showFieldEditor=false">取消</button>
            <button class="btn btn-primary" @click="saveFields" :disabled="savingFields">
              {{ savingFields ? '保存中...' : '保存字段' }}
            </button>
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
        closeModal(); loadRecords(); if (viewMode.value === 'kanban') loadKanban(); if (viewMode.value === 'calendar') loadCalendar();
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
    // ========== 看板视图 ==========
    const viewMode = ref('table');
    const kanbanGroupBy = ref('');
    const kanbanColumns = ref([]);
    const kanbanFieldMeta = ref(null);
    const draggingId = ref(null);
    const draggingRecord = ref(null);
    const dragOverColumn = ref(null);

    const kanbanFields = computed(() => (table.value.fields || []).filter(f => f.type === 'select' || f.type === 'checkbox'));

    function switchView(mode) {
      viewMode.value = mode;
      if (mode === 'kanban') {
        if (!kanbanGroupBy.value && kanbanFields.value.length > 0) {
          kanbanGroupBy.value = kanbanFields.value[0].name;
        }
        loadKanban();
      } else if (mode === 'calendar') {
        if (!calDateField.value && calDateFields.value.length > 0) {
          calDateField.value = calDateFields.value[0].name;
        }
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
          value: c,
          color: colors[i % colors.length],
          records: recordsByCol[c] || [],
        }));
        total.value = Object.values(recordsByCol).reduce((s, arr) => s + arr.length, 0);
        kanbanFieldMeta.value = res.data.field_meta;
      } catch (e) { showToast('加载看板失败', 'error'); }
    }

    function kanbanDragStart(r) {
      draggingId.value = r.id;
      draggingRecord.value = r;
    }
    function kanbanDragOver(colValue) { dragOverColumn.value = colValue; }
    function kanbanDragLeave() { dragOverColumn.value = null; }
    async function kanbanDrop(colValue) {
      if (!draggingRecord.value || !kanbanGroupBy.value) return;
      if (draggingRecord.value.data[kanbanGroupBy.value] === colValue) {
        draggingId.value = null; draggingRecord.value = null; dragOverColumn.value = null; return;
      }
      try {
        await api.put(`/records/${draggingRecord.value.id}/kanban`, {
          group_field: kanbanGroupBy.value,
          group_value: colValue,
        });
        await loadKanban();
      } catch (e) { showToast('移动失败', 'error'); }
      draggingId.value = null; draggingRecord.value = null; dragOverColumn.value = null;
    }

    function openAddForColumn(colValue) {
      editingRecord.value = null;
      formData.value = { [kanbanGroupBy.value]: colValue };
      showModal.value = true;
    }

    // ========== 日历视图 ==========
    const calDateField = ref('');
    const calYear = ref(new Date().getFullYear());
    const calMonth = ref(new Date().getMonth());
    const calCells = ref([]);
    const calEventsMap = ref({});
    const calEventColors = ['#4F46E5','#059669','#D97706','#DC2626','#0891B2','#7C3AED','#DB2777','#0D9488'];

    const calDateFields = computed(() => (table.value.fields || []).filter(f => f.type === 'date'));

    function buildCalCells() {
      const y = calYear.value, m = calMonth.value;
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      // 星期几 (0=Sun..6=Sat)，转换为周一=0
      let startDow = firstDay.getDay();
      startDow = startDow === 0 ? 6 : startDow - 1;
      const cells = [];
      // 上月补齐
      for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(y, m, -i);
        const ds = fmtDate(d);
        cells.push({ day: d.getDate(), dateStr: null, isOtherMonth: true, isToday: false, events: calEventsMap.value[ds] || [] });
      }
      // 当月
      const today = new Date();
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dd = new Date(y, m, d);
        const ds = fmtDate(dd);
        const isToday = dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate();
        cells.push({ day: d, dateStr: ds, isOtherMonth: false, isToday, events: calEventsMap.value[ds] || [] });
      }
      // 下月补齐到42格
      while (cells.length < 42) {
        const d = new Date(y, m + 1, cells.length - startDow - lastDay.getDate() + 1);
        const ds = fmtDate(d);
        cells.push({ day: d.getDate(), dateStr: null, isOtherMonth: true, isToday: false, events: calEventsMap.value[ds] || [] });
      }
      calCells.value = cells;
    }

    function fmtDate(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    async function loadCalendar() {
      if (!calDateField.value) return;
      try {
        const res = await api.get(`/tables/${props.tableId}/calendar`, { params: { date_field: calDateField.value } });
        const em = {};
        (res.data.events || []).forEach((ev, ei) => {
          em[ev.date] = (ev.records || []).map(r => ({
            ...r,
            _label: r.data[calDateField.value] ? r.data[calDateField.value] : '记录',
            _color: calEventColors[ei % calEventColors.length],
          }));
        });
        calEventsMap.value = em;
        buildCalCells();
      } catch (e) { showToast('加载日历失败', 'error'); }
    }

    function calPrevMonth() {
      if (calMonth.value === 0) { calMonth.value = 11; calYear.value--; }
      else calMonth.value--;
      buildCalCells();
    }
    function calNextMonth() {
      if (calMonth.value === 11) { calMonth.value = 0; calYear.value++; }
      else calMonth.value++;
      buildCalCells();
    }
    function calToday() {
      const t = new Date();
      calYear.value = t.getFullYear();
      calMonth.value = t.getMonth();
      buildCalCells();
    }
    function openAddForDate(dateStr) {
      editingRecord.value = null;
      formData.value = { [calDateField.value]: dateStr };
      showModal.value = true;
    }

    // ========== 表单管理 ==========
    const showFormsPanel = ref(false);
    const forms = ref([]);
    const savingForm = ref(false);
    const newForm = ref({ name: '', description: '', allowed_fields: [] });
    const showFieldEditor = ref(false);
    const editingFields = ref([]);
    const savingFields = ref(false);

    // ========== CSV导入 ==========
    const showImport = ref(false);
    const importStep = ref('upload');
    const importData = ref([]);
    const importHeaders = ref([]);
    const fieldMap = ref({});   // csv列名 → 表字段名
    const importError = ref('');
    const importing = ref(false);
    const importedCount = ref(0);
    const importFailed = ref(0);
    const dragOver = ref(false);

    function triggerImport() {
      showImport.value = true;
      importStep.value = 'upload';
      importData.value = [];
      importHeaders.value = [];
      fieldMap.value = {};
      importError.value = '';
    }

    function handleFileDrop(e) {
      dragOver.value = false;
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    }

    function handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) parseFile(file);
    }

    function parseFile(file) {
      importError.value = '';
      if (!file.name.match(/\.(csv|txt)$/i)) {
        importError.value = '请选择 CSV 或 TXT 文件'; return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          if (lines.length < 2) { importError.value = '文件数据不足，至少需要1行表头+1行数据'; return; }
          // 简单CSV解析（逗号分隔，支持引号包裹）
          function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuote = false;
            for (let i = 0; i < line.length; i++) {
              const c = line[i];
              if (c === '"') {
                if (inQuote && line[i+1] === '"') { current += '"'; i++; }
                else inQuote = !inQuote;
              } else if (c === ',' && !inQuote) {
                result.push(current.trim()); current = '';
              } else current += c;
            }
            result.push(current.trim());
            return result;
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
          // 自动建立映射：CSV列名匹配字段名
          const map = {};
          headers.forEach(h => {
            const matched = table.value.fields?.find(f => f.name === h);
            map[h] = matched ? h : '';
          });
          fieldMap.value = map;
          importStep.value = 'preview';
        } catch (err) {
          importError.value = '文件解析失败：' + err.message;
        }
      };
      reader.readAsText(file);
    }

    async function doImport() {
      // 过滤出有映射的列
      const mappedCols = Object.entries(fieldMap.value).filter(([,v]) => v);
      if (!mappedCols.length) { importError.value = '请至少选择一个字段映射'; return; }
      importing.value = true;
      importError.value = '';
      let success = 0, failed = 0;
      try {
        for (const row of importData.value) {
          const recordData = {};
          for (const [csvCol, fieldName] of mappedCols) {
            recordData[fieldName] = row[csvCol] || '';
          }
          try {
            await api.post(`/tables/${props.tableId}/records`, { data: recordData });
            success++;
          } catch { failed++; }
        }
        importedCount.value = success;
        importFailed.value = failed;
        importStep.value = 'done';
      } finally {
        importing.value = false;
      }
    }

    function downloadTemplate() {
      const headers = table.value.fields?.map(f => f.name) || [];
      const csv = '\uFEFF' + headers.join(',') + '\n' + headers.map(() => '').join(',');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${table.value.name || '数据'}_导入模板.csv`; a.click();
      URL.revokeObjectURL(url);
    }

    async function loadForms() {
      try {
        const res = await api.get(`/tables/${props.tableId}/forms`);
        forms.value = res.data;
      } catch (e) { console.error('加载表单失败', e); }
    }

    async function createForm() {
      if (!newForm.value.name.trim()) return;
      savingForm.value = true;
      try {
        await api.post(`/tables/${props.tableId}/forms`, {
          name: newForm.value.name,
          description: newForm.value.description,
          allowed_fields: newForm.value.allowed_fields,
        });
        newForm.value = { name: '', description: '', allowed_fields: [] };
        await loadForms();
        showToast('表单创建成功', 'success');
      } catch (e) { showToast('创建失败', 'error'); }
      finally { savingForm.value = false; }
    }

    async function deleteForm(f) {
      if (!confirm(`删除表单「${f.name}」？`)) return;
      try {
        await api.delete(`/forms/${f.id}`);
        await loadForms();
        showToast('已删除', 'success');
      } catch (e) { showToast('删除失败', 'error'); }
    }

    function toggleFormField(name) {
      const idx = newForm.value.allowed_fields.indexOf(name);
      if (idx >= 0) newForm.value.allowed_fields.splice(idx, 1);
      else newForm.value.allowed_fields.push(name);
    }

    function formPublicUrl(key) {
      return `${(window.location.origin || "")}/#/public/form/${key}`;
    }

    function copyFormUrl(key) {
      navigator.clipboard.writeText(formPublicUrl(key)).then(() => showToast('链接已复制', 'success'));
    }
    function addNewField() { editingFields.value.push({ name: '', type: 'select', required: false, options: ['选项1'] }); }
    function removeField(i) { editingFields.value.splice(i, 1); }
    async function saveFields() {
      savingFields.value = true;
      try {
        await api.put(`/tables/${props.tableId}`, { fields: editingFields.value });
        showToast('字段已保存', 'success');
        showFieldEditor.value = false;
        await loadTable();
      } catch (e) { showToast('保存失败', 'error'); }
      finally { savingFields.value = false; }
    }
    function exportCSV() {
      const fields = table.value.fields || [];
      const rows = [[...fields.map(f => f.name), 'ID', '创建时间']];
      records.value.forEach(r => {
        rows.push([...fields.map(f => r.data[f.name] || ''), r.id, r.created_at || '']);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${table.value.name || '导出数据'}.csv`;
      a.click();
      showToast('已导出 CSV', 'success');
    }

    watch(showFormsPanel, (v) => { if (v) loadForms(); });
    watch(showFieldEditor, (v) => { if (v) editingFields.value = JSON.parse(JSON.stringify(table.value.fields || [])); });
    watch(() => props.tableId, () => { showFormsPanel.value = false; showFieldEditor.value = false; });

    watch(() => table.value.fields, (fields) => {
      // 默认全选所有字段
      newForm.value.allowed_fields = fields.map(f => f.name);
    }, { immediate: true });

    watch(() => props.tableId, () => { loadTable(); loadRecords(); }, { immediate: true });
    function debugAddOpt(f) { f.options = f.options || []; f.options.push('选项'+(f.options.length+1)); }
    return {
      table, records, total, pages, page, search, showModal, editingRecord, formData, saving,
      viewMode, kanbanGroupBy, kanbanColumns, kanbanFields, draggingId, dragOverColumn,
      debounceSearch, openAdd, editRecord, saveRecord, deleteRecord, closeModal, loadRecords, goBack,
      switchView, loadKanban, kanbanDragStart, kanbanDragOver, kanbanDragLeave, kanbanDrop, openAddForColumn,
      calDateField, calYear, calMonth, calCells, calDateFields, calPrevMonth, calNextMonth, calToday, loadCalendar, openAddForDate,
      showFormsPanel, forms, savingForm, newForm, createForm, deleteForm, toggleFormField, formPublicUrl, copyFormUrl,
      showFieldEditor, editingFields, savingFields, addNewField, removeField, saveFields, exportCSV, debugAddOpt,
      showImport, importStep, importData, importHeaders, fieldMap, importError, importing, importedCount, importFailed, dragOver,
      triggerImport, handleFileDrop, handleFileSelect, doImport, downloadTemplate,
    };
  }
};

// ============ 公开表单（无需登录）============
const PublicForm = {
  props: ['formKey'],
  setup(props) {
    const formDef = ref(null);
    const formData = ref({});
    const submitting = ref(false);
    const submitted = ref(false);
    const error = ref('');
    async function loadForm() {
      try {
        const res = await fetch(`${(window.location.origin || "")}/api/public/forms/${props.formKey}`);
        if (!res.ok) throw new Error('表单不存在或已停用');
        const data = await res.json();
        formDef.value = data;
        data.fields.forEach(f => { formData.value[f.name] = ''; });
      } catch (e) { error.value = e.message; }
    }
    async function submit() {
      submitting.value = true; error.value = '';
      try {
        const res = await fetch(`${(window.location.origin || "")}/api/public/forms/${props.formKey}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(formData.value),
        });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error || '提交失败');
        submitted.value = true;
      } catch (e) { error.value = e.message; }
      finally { submitting.value = false; }
    }
    onMounted(loadForm);
    return { formDef, formData, submitting, submitted, error, submit };
  },
  template: `
    <div style="max-width:600px;margin:60px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif">
      <div v-if="error" style="text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:16px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
        <h2 style="color:#333;margin-bottom:8px">表单不存在</h2>
        <p style="color:#666">{{ error }}</p>
      </div>
      <div v-else-if="submitted" style="text-align:center;padding:60px 20px;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="font-size:64px;margin-bottom:20px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79M4 3h.01M8 7h4m4 0h.01M11 11h.01M20.7 3a9 9 0 0 1 0 13.3"/><path d="M14 3a9 9 0 0 1-2.6 5.5L20 22"/></svg></div>
        <h2 style="color:#333;margin-bottom:12px">提交成功！</h2>
        <p style="color:#666">感谢您的填写，数据已收到</p>
      </div>
      <div v-else-if="!formDef" style="text-align:center;padding:60px;color:#666">加载中...</div>
      <div v-else style="background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden">
        <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:28px 32px">
          <h1 style="color:white;font-size:22px;margin:0 0 8px">{{ formDef.name }}</h1>
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px">{{ formDef.description }}</p>
        </div>
        <form @submit.prevent="submit" style="padding:28px 32px">
          <div v-for="f in formDef.fields" :key="f.name" style="margin-bottom:20px">
            <label style="display:block;margin-bottom:8px;font-weight:600;font-size:15px;color:#333">
              {{ f.name }}<span v-if="f.required" style="color:#DC2626">*</span>
            </label>
            <textarea v-if="f.type==='textarea'" v-model="formData[f.name]" rows="3"
              style="width:100%;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;resize:none;box-sizing:border-box"></textarea>
            <input v-else-if="f.type==='checkbox'" type="checkbox" v-model="formData[f.name]" style="width:18px;height:18px">
            <input v-else-if="f.type==='number' || f.type==='currency'" type="number" v-model="formData[f.name]"
              style="width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;box-sizing:border-box">
            <input v-else-if="f.type==='date'" type="date" v-model="formData[f.name]"
              style="width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;box-sizing:border-box">
            <select v-else-if="f.type==='select'" v-model="formData[f.name]"
              style="width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;box-sizing:border-box;background:white">
              <option value="">请选择</option>
              <option v-for="opt in (f.options||[])" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input v-else type="text" v-model="formData[f.name]"
              style="width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;box-sizing:border-box">
          </div>
          <p v-if="error" style="color:#DC2626;font-size:14px;margin-bottom:12px">{{ error }}</p>
          <button type="submit" :disabled="submitting"
            style="width:100%;padding:14px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </form>
      </div>
    </div>
  `,
};

// ============ 主应用 ============

// ============ 个人中心 ============
const ProfileView = {
  props: ['user'],
  setup(props) {
    const darkMode = ref(localStorage.getItem('lingda_dark') === '1');
    function toggleDark() {
      darkMode.value = !darkMode.value;
      localStorage.setItem('lingda_dark', darkMode.value ? '1' : '0');
      document.body.classList.toggle('dark-mode', darkMode.value);
    }
    function logout() {
      localStorage.removeItem('lingda_token');
      window.location.hash = '#login';
      window.location.reload();
    }
    function exportData() {
      const token = localStorage.getItem('lingda_token');
      fetch(window.location.origin + '/api/auth/export-data', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(r => r.json()).then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'lingda_data_' + new Date().toISOString().slice(0,10) + '.json'; a.click();
        URL.revokeObjectURL(url);
        showToast('数据已导出', 'success');
      }).catch(() => showToast('导出失败', 'error'));
    }
    function deleteAccount() {
      const pwd = prompt('请输入当前密码以确认注销账号（此操作不可逆，会删除所有数据）：');
      if (!pwd) return;
      if (!confirm('确定要注销账号吗？所有数据将被永久删除！')) return;
      const token = localStorage.getItem('lingda_token');
      fetch(window.location.origin + '/api/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      }).then(r => r.json()).then(data => {
        if (data.error) { showToast(data.error, 'error'); return; }
        showToast('账号已注销，再见！', 'success');
        setTimeout(() => { localStorage.removeItem('lingda_token'); window.location.hash = '#login'; window.location.reload(); }, 1500);
      }).catch(() => showToast('注销失败', 'error'));
    }
    const initials = computed(() => {
      if (!props.user?.name) return '?';
      return props.user.name.slice(0, 2);
    });
    return { darkMode, toggleDark, logout, initials, exportData, deleteAccount };
  },
  template: `
    <div class="profile-view">
      <div class="profile-card">
        <div class="profile-avatar">{{ initials }}</div>
        <div class="profile-name">{{ user?.name || '未设置昵称' }}</div>
        <div class="profile-email">{{ user?.email || '' }}</div>
      </div>
      <div class="profile-section">
        <div class="profile-section-title">设置</div>
        <div class="profile-item" @click="toggleDark">
          <span>{{ darkMode ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>️ 切换亮色模式' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> 切换暗色模式' }}</span>
        </div>
      </div>
      <div class="profile-section">
        <div class="profile-section-title">数据管理</div>
        <div class="profile-item" @click="exportData">
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> 导出我的数据</span>
        </div>
        <div class="profile-item danger" @click="deleteAccount">
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>️ 注销账号</span>
        </div>
      </div>
      <div style="flex:1"></div>
      <div class="profile-section">
        <div class="profile-item danger" @click="logout">
          <span>⏻ 退出登录</span>
        </div>
      </div>
    </div>
  `
};

// ============ 管理员后台 ============
const AdminPanel = {
  template: `
    <div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <h2 style="font-size:20px;font-weight:800;margin:0">控制台</h2>
          <p style="color:var(--text-secondary);font-size:13px;margin:4px 0 0">平台运营数据总览</p>
        </div>
        <button class="btn btn-secondary" @click="goBack">← 返回</button>
      </div>

      <!-- 统计卡片 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-bottom:24px">
        <div class="stat-card"><div style="font-size:28px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div style="font-size:24px;font-weight:800;color:var(--primary)">{{ stats.users ? stats.users.total : 0 }}</div><div style="font-size:12px;color:var(--text-secondary)">总用户</div></div>
        <div class="stat-card"><div style="font-size:28px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div><div style="font-size:24px;font-weight:800;color:var(--primary)">{{ stats.apps ? stats.apps.total : 0 }}</div><div style="font-size:12px;color:var(--text-secondary)">应用</div></div>
        <div class="stat-card"><div style="font-size:28px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>️</div><div style="font-size:24px;font-weight:800;color:var(--primary)">{{ stats.tables ? stats.tables.total : 0 }}</div><div style="font-size:12px;color:var(--text-secondary)">数据表</div></div>
        <div class="stat-card"><div style="font-size:28px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><div style="font-size:24px;font-weight:800;color:var(--primary)">{{ stats.records ? stats.records.total : 0 }}</div><div style="font-size:12px;color:var(--text-secondary)">记录</div></div>
        <div class="stat-card"><div style="font-size:28px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg></div><div style="font-size:24px;font-weight:800;color:var(--primary)">{{ stats.forms ? stats.forms.total : 0 }}</div><div style="font-size:12px;color:var(--text-secondary)">公开表单</div></div>
      </div>

      <!-- 用户列表 -->
      <div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="font-weight:700">用户列表</div>
          <input v-model="searchKw" @input="doSearch" placeholder="搜索用户..." style="padding:7px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none">
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:500px">
            <thead>
              <tr style="background:var(--bg)">
                <th style="padding:9px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border)">用户</th>
                <th style="padding:9px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border)">应用</th>
                <th style="padding:9px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border)">状态</th>
                <th style="padding:9px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border)">注册时间</th>
                <th style="padding:9px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--text-secondary);border-bottom:1px solid var(--border)">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" style="border-bottom:1px solid var(--border)">
                <td style="padding:10px 12px">
                  <div style="font-weight:600;font-size:14px">{{ u.name || '未命名' }}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">{{ u.email }}</div>
                </td>
                <td style="padding:10px 12px;font-weight:600;color:var(--primary)">{{ u.app_count }}</td>
                <td style="padding:10px 12px">
                  <span v-if="u.email_verified" style="padding:2px 8px;background:#D1FAE5;color:#065F46;border-radius:12px;font-size:11px;font-weight:600">已验证</span>
                  <span v-else style="padding:2px 8px;background:#FEF3C7;color:#92400E;border-radius:12px;font-size:11px;font-weight:600">未验证</span>
                  <span v-if="u.is_admin" style="padding:2px 6px;background:var(--primary);color:white;border-radius:12px;font-size:11px;font-weight:600;margin-left:3px">管理员</span>
                </td>
                <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary)">{{ u.created_at ? u.created_at.slice(0,10) : '—' }}</td>
                <td style="padding:10px 12px">
                  <button v-if="u.id !== myId" @click="toggleAdmin(u)" style="padding:3px 10px;background:var(--bg);border:1.5px solid var(--border);border-radius:7px;cursor:pointer;font-size:12px" :style="u.is_admin ? 'color:var(--danger);border-color:var(--danger)' : 'color:var(--primary);border-color:var(--primary)'">
                    {{ u.is_admin ? '撤销' : '设为管理员' }}
                  </button>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="5" style="padding:32px;text-align:center;color:var(--text-secondary)">暂无用户</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap;gap:10px">
          <span style="font-size:12px;color:var(--text-secondary)">共 {{ totalUsers }} 位用户</span>
          <div style="display:flex;gap:6px">
            <button @click="prevPage" :disabled="page <= 1" style="padding:5px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:7px;cursor:pointer;font-size:12px">上一页</button>
            <span style="padding:5px 10px;font-size:12px;font-weight:600">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="page >= totalPages" style="padding:5px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:7px;cursor:pointer;font-size:12px">下一页</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const stats = ref({});
    const users = ref([]);
    const totalUsers = ref(0);
    const totalPages = ref(1);
    const page = ref(1);
    const searchKw = ref('');
    const myId = ref(null);
    let searchTimer = null;

    function loc() { return (typeof location !== 'undefined') ? location : { hash: { slice: () => 'dashboard' }, reload: () => {} }; }

    async function loadStats() {
      try {
        const res = await api.get('/admin/stats');
        stats.value = res.data;
      } catch (e) { console.error('加载统计失败', e); }
    }

    async function loadUsers() {
      try {
        const res = await api.get('/admin/users', { params: { page: page.value, search: searchKw.value } });
        users.value = res.data.users;
        totalUsers.value = res.data.total;
        totalPages.value = res.data.pages;
      } catch (e) { console.error('加载用户失败', e); }
    }

    function doSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { page.value = 1; loadUsers(); }, 400);
    }

    function prevPage() { if (page.value > 1) { page.value--; loadUsers(); } }
    function nextPage() { if (page.value < totalPages.value) { page.value++; loadUsers(); } }

    async function toggleAdmin(u) {
      try {
        await api.post('/admin/users/' + u.id + '/toggle-admin');
        u.is_admin = !u.is_admin;
      } catch (e) { showToast(e.response && e.response.data && e.response.data.error || '操作失败', 'error'); }
    }

    function goBack() { window.location.hash = '#dashboard'; }

    onMounted(async () => {
      try {
        const me = await api.get('/auth/me');
        myId.value = me.data.id;
      } catch {}
      loadStats();
      loadUsers();
    });

    return { stats, users, totalUsers, totalPages, page, searchKw, myId, doSearch, prevPage, nextPage, toggleAdmin, goBack };
  }
};

const App = {
  setup() {
    const route = ref(window.location.hash.slice(1) || 'dashboard');
    function parseRoute(h) {
      const parts = h.split('/').filter(Boolean);
      if (parts[0] === 'login') return 'login';
      if (parts[0] === 'public' && parts[1] === 'form') return { view: 'public_form', formKey: parts[2] };
      if (parts[0] === 'app') {
        if (parts[2] === 'table') return { view: 'table', appId: parts[1], tableId: parts[3] };
        return { view: 'app', appId: parts[1] };
      }
      if (parts[0] === 'admin') return 'admin';
      return parts[0] || 'dashboard';
    }
    const currentUser = ref(null);
    function loc() { return (typeof location !== 'undefined') ? location : { hash: { slice: () => 'dashboard' }, reload: () => {} }; }
    async function checkAuth() {
      const hash = window.location.hash.slice(1) || 'dashboard';
      const initialRoute = parseRoute(hash);
      // 公开表单无需登录
      if (initialRoute.view === 'public_form') { route.value = initialRoute; return; }
      const token = localStorage.getItem('lingda_token');
      if (!token) { route.value = 'login'; return; }
      try {
        const res = await api.get('/auth/me');
        currentUser.value = res.data;
        route.value = initialRoute;
        if (route.value === 'login') route.value = 'dashboard';
      } catch { localStorage.removeItem('lingda_token'); route.value = 'login'; }
    }
    function goProfile() { window.location.hash = '#profile'; }
    function goAdmin() { window.location.hash = '#admin'; }
    function navigate() { route.value = parseRoute(window.location.hash.slice(1) || 'dashboard'); }
    function logout() { localStorage.removeItem('lingda_token'); window.location.hash = '#login'; window.location.reload(); }
    function goDashboard() { window.location.hash = '#dashboard'; }
    function goAppFromMobile() { if (routeParams.value?.appId) window.location.hash = '#app/' + routeParams.value.appId; }
    function confirmLogout() { if (confirm('确定退出登录？')) logout(); }
    onMounted(async () => { await checkAuth(); window.addEventListener('hashchange', navigate); });
    const currentView = computed(() => typeof route.value === 'string' ? route.value : (route.value?.view || null));
    const routeParams = computed(() => typeof route.value === 'object' ? route.value : null);
    return { view: route, currentView, routeParams, logout, goDashboard, goAppFromMobile, confirmLogout, goProfile, goAdmin, currentUser };
  },
  template: `
    <auth-page v-if="view==='login'" />
    <public-form v-else-if="view==='public_form'" :formKey="routeParams?.formKey" />
    <div v-else class="admin-layout">
      <div class="sidebar">
        <div class="sidebar-logo">
          <h2>零搭</h2>
          <span>NoCode 平台</span>
        </div>
        <div class="sidebar-nav">
          <div class="sidebar-item" :class="{active: currentView==='dashboard'}" @click="goDashboard">
            <i class="□"></i> 我的应用
          </div>
          <div v-if="currentUser?.is_admin" class="sidebar-item" :class="{active: currentView==='admin'}" @click="goAdmin">
            <i class="□"></i> 控制台
          </div>
          <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
            <div class="sidebar-item" @click="logout" style="color:var(--danger)">
              <i class="⏻"></i> 退出登录
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="topbar" style="display:flex;align-items:center;justify-content:space-between">
          <div class="topbar-title">{{ currentView === 'app' ? '应用详情' : currentView === 'table' ? '数据管理' : '我的应用' }}</div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:13px;color:var(--text-secondary);display:none" class="show-mobile">退出登录</div>
            <button @click="logout" class="btn btn-secondary" style="padding:6px 14px;font-size:13px;border-radius:20px" class="show-desktop">退出登录</button>
          </div>
        </div>
        <app-list v-if="currentView==='dashboard'" />
        <app-detail v-else-if="currentView==='app'" :appId="routeParams?.appId" :key="'app-'+routeParams?.appId" />
        <table-detail v-else-if="currentView==='table'" :appId="routeParams?.appId" :tableId="routeParams?.tableId" :key="'table-'+routeParams?.tableId" />
        <profile-view v-else-if="currentView==='profile'" :user="currentUser" />
        <admin-panel v-else-if="currentView==='admin'" />
      </div>
      <!-- 手机底部导航 -->
      <nav class="mobile-nav">
        <div class="mobile-nav-item" :class="{active: currentView==='dashboard'}" @click="goDashboard">
          <i class="□"></i>
          <span>应用</span>
        </div>
        <div class="mobile-nav-item" v-if="currentView!=='dashboard' && currentView!=='profile'" @click="goAppFromMobile">
          <i class="⊕"></i>
          <span>数据表</span>
        </div>
        <div class="mobile-nav-item" @click="goProfile">
          <i class="<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>"></i>
          <span>我的</span>
        </div>
      </nav>
    </div>
  `,
  components: { AuthPage, AppList, AppDetail, TableDetail, PublicForm, ProfileView, AdminPanel }
};



const app = createApp(App);

app.mount('#app');
