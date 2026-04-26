// ConfirmDialog 组件 - 危险操作确认弹窗
// 全局组件，通过 provide/inject 访问全局 showConfirm 状态
// 用法: <ConfirmDialog />

const CONFIRM_KEY = Symbol('confirmDialog');

const ConfirmDialog = {
  name: 'ConfirmDialog',
  inject: {
    _showConfirm: { from: CONFIRM_KEY },
    _confirmOk: { from: Symbol('confirmOk') },
  },
  computed: {
    showConfirm() {
      // Try inject first, fall back to window if not provided (backwards compat)
      if (this._showConfirm !== undefined) return this._showConfirm;
      if (window.__showConfirm !== undefined) return window.__showConfirm;
      return null;
    },
    confirmOk() {
      if (this._confirmOk) return this._confirmOk;
      if (window.__confirmOk) return window.__confirmOk;
      return () => {};
    },
  },
  methods: {
    cancel() {
      const sc = this.showConfirm;
      if (sc && typeof sc === 'object') {
        if (typeof sc.cancel === 'function') sc.cancel();
        else if (sc._onCancel) sc._onCancel();
      }
      this._close();
    },
    confirm() {
      const sc = this.showConfirm;
      if (sc && typeof sc === 'object' && sc.action) {
        const fn = sc.action;
        this._close();
        fn();
      }
    },
    _close() {
      const sc = this.showConfirm;
      if (sc && typeof sc === 'object') sc.value = null;
      else if (typeof this._closeFn === 'function') this._closeFn();
    },
  },
  template: `
    <div v-if="showConfirm" class="modal-overlay" @click.self="cancel">
      <div style="background:var(--surface);border-radius:16px;padding:28px;max-width:360px;width:100%;text-align:center;box-shadow:var(--shadow-lg)">
        <div style="width:48px;height:48px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#DC2626;font-size:24px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p style="font-size:16px;font-weight:600;margin-bottom:24px">{{ typeof showConfirm === 'object' ? showConfirm.msg : showConfirm }}</p>
        <div style="display:flex;gap:12px">
          <button @click="cancel"
            style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:10px;background:white;font-size:15px;font-weight:600;cursor:pointer">
            取消
          </button>
          <button @click="confirm"
            style="flex:1;padding:12px;background:var(--danger);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">
            确定
          </button>
        </div>
      </div>
    </div>
  `,
};

// 注册为全局组件
app.component('ConfirmDialog', ConfirmDialog);
