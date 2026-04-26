// ============================================================
// 零搭平台 - 组件库 (components.js)
// 在 vue.global.js 之后、app.js 之后加载
// 使用 Vue.* 前缀访问全局 Vue 组合式 API
// ============================================================

// -------------------- StatsCard --------------------
// 用法: <StatsCard label="应用总数" :value="10" gradient="purple" />
const GRADIENTS = {
  purple: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  green:  'linear-gradient(135deg, #059669, #10B981)',
  orange: 'linear-gradient(135deg, #D97706, #F59E0B)',
  red:    'linear-gradient(135deg, #DC2626, #EF4444)',
  blue:   'linear-gradient(135deg, #2563EB, #3B82F6)',
  pink:   'linear-gradient(135deg, #DB2777, #EC4899)',
};

// 创建 app 实例（在所有 app.component 调用之前）
const app = Vue.createApp(window.__App);

// 全局状态共享 key

app.component('StatsCard', {
  name: 'StatsCard',
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    gradient: { type: String, default: 'purple' },
  },
  computed: {
    bg() { return GRADIENTS[this.gradient] || GRADIENTS.purple; },
  },
  template: `
    <div class="stats-card" :style="{ background: bg }">
      <div class="stats-card-value">{{ value }}</div>
      <div class="stats-card-label">{{ label }}</div>
    </div>
  `,
});


// -------------------- AppCard --------------------
// 用法: <AppCard :app="app" @delete="fn" @click="fn" />
app.component('AppCard', {
  name: 'AppCard',
  props: { app: { type: Object, required: true } },
  emits: ['delete', 'click'],
  setup(props, { emit }) {
    const swipedId = Vue.ref(null);
    const transitioning = Vue.ref(false);
    let touchStartX = 0, touchStartY = 0, didSwipe = false, clickBlocked = false;

    function handleClick() {
      if (clickBlocked) { clickBlocked = false; return; }
      swipedId.value = null;
      emit('click', props.app);
    }
    function onTouchStart(e) {
      touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
      didSwipe = false; transitioning.value = false;
    }
    function onTouchMove(e) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!didSwipe && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) didSwipe = true;
      if (didSwipe) {
        e.preventDefault();
        e.currentTarget.style.transform = `translateX(${Math.max(-80, dx)}px)`;
        if (swipedId.value !== props.app.id) swipedId.value = props.app.id;
      }
    }
    function onTouchEnd(e) {
      transitioning.value = true;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (!didSwipe) { swipedId.value = null; e.currentTarget.style.transform = ''; }
      else {
        clickBlocked = true;
        if (dx < -40) { e.currentTarget.style.transform = 'translateX(-80px)'; swipedId.value = props.app.id; }
        else { e.currentTarget.style.transform = ''; swipedId.value = null; }
      }
    }
    const iconData = Vue.computed(() => {
      const opts = window.ICON_OPTIONS || [];
      const map = window.ICON_MAP || {};
      const iconKey = props.app?.icon;
      return map[iconKey] || opts[0] || { bg: '#EEF2FF', color: '#4F46E5', svg: '' };
    });
    return { swipedId, transitioning, handleClick, onTouchStart, onTouchMove, onTouchEnd, iconData };
  },
  template: `
    <div style="position:relative;overflow:hidden;border-radius:12px">
      <div v-if="swipedId === app.id"
        @click="swipedId = null"
        style="position:absolute;top:0;right:0;bottom:0;width:80px;background:#DC2626;display:flex;align-items:center;justify-content:center;z-index:0;border-radius:12px">
        <button @click.stop="$emit('delete', app)"
          style="background:none;border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4">删<br>除</button>
      </div>
      <div class="app-card"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
        @click="handleClick"
        :style="{ transform: swipedId === app.id ? 'translateX(-80px)' : 'translateX(0)', transition: transitioning ? 'transform 0.3s' : 'none', position:'relative', zIndex:1 }">
        <div class="app-card-icon"
          :style="{ background: iconData.bg, color: iconData.color }"
          v-html="iconData.svg"></div>
        <div class="app-card-name">{{ app.name }}</div>
        <div class="app-card-desc">{{ app.description || '暂无描述' }}</div>
        <div class="app-card-meta">
          <span>{{ app.table_count }} 个数据表</span>
          <button @click.stop="$emit('delete', app)"
            style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px;font-weight:600;padding:0;margin-left:auto">删除</button>
        </div>
      </div>
    </div>
  `,
});


// -------------------- TableCard --------------------
// 用法: <TableCard :table="table" @delete="fn" @click="fn" />
app.component('TableCard', {
  name: 'TableCard',
  props: { table: { type: Object, required: true } },
  emits: ['delete', 'click'],
  template: `
    <div class="table-card" @click="$emit('click', table)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:8px;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" style="width:18px;height:18px">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </div>
        <button @click.stop="$emit('delete', table)"
          style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px;font-weight:600;padding:4px 8px;opacity:0.7">删除</button>
      </div>
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ table.name }}</div>
      <div style="font-size:12px;color:var(--text-secondary)">{{ table.field_count || 0 }} 个字段 · {{ table.record_count || 0 }} 条记录</div>
    </div>
  `,
});


// -------------------- ConfirmDialog --------------------
// 全局确认弹窗
// App 根组件 provide(showConfirm)，此组件 inject 使用
app.component('ConfirmDialog', {
  name: 'ConfirmDialog',
  inject: {
    _showConfirm: { from: 'confirmRef', default: null },
    _confirmClose: { from: 'confirmClose', default: null },
  },
  computed: {
    // showConfirm is a Vue.ref provided directly from App's setup
    sc() {
      const v = this._showConfirm;
      if (!v) return null;
      // v should be a Vue.ref - Vue auto-unwraps in provide, so v IS the ref object
      // If v has .value property (it's a ref-like), unwrap it
      return (v && typeof v === 'object' && 'value' in v) ? v.value : v;
    },
    msg() {
      const s = this.sc;
      return s ? (typeof s === 'object' ? s.msg : String(s)) : '';
    },
  },
  methods: {
    doCancel() {
      const s = this.sc;
      if (s && typeof s === 'object') {
        if (typeof s.cancel === 'function') s.cancel();
        else if (typeof s.onCancel === 'function') s.onCancel();
      }
      this.close();
    },
    doConfirm() {
      const s = this.sc;
      if (s && typeof s === 'object' && s.action) {
        const fn = s.action;
        this.close();
        fn();
      }
    },
    close() {
      const v = this._showConfirm;
      if (v && typeof v === 'object' && 'value' in v) { v.value = null; return; }
      // v might be the raw ref or already unwrapped - try both
      if (v && typeof v === 'object') { v.value = null; }
      if (this._confirmClose) { this._confirmClose(); return; }
      if (window.__confirmClose) { window.__confirmClose(); }
    },
  },
  template: `
    <div v-if="sc && msg" class="modal-overlay" @click.self="doCancel"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px">
      <div style="background:#fff;border-radius:16px;padding:28px;max-width:360px;width:100%;text-align-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.1)">
        <div style="width:48px;height:48px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" width="24" height="24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p style="font-size:16px;font-weight:600;margin-bottom:24px;text-align:center;color:#111827">{{ msg }}</p>
        <div style="display:flex;gap:12px">
          <button @click="doCancel"
            style="flex:1;padding:12px;border:1.5px solid #e5e7eb;border-radius:10px;background:white;font-size:15px;font-weight:600;cursor:pointer;color:#374151">
            取消
          </button>
          <button @click="doConfirm"
            style="flex:1;padding:12px;background:#dc2626;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">
            确定
          </button>
        </div>
      </div>
    </div>
  `,
});


// -------------------- KanbanColumn --------------------
// 用法: <KanbanColumn :column="col" :fields="fields" :selectField="sf" :allRecords="records" @deleteRecord="fn" @editRecord="fn" />
app.component('KanbanColumn', {
  name: 'KanbanColumn',
  props: {
    column: { type: Object, required: true },
    fields: { type: Array, default: () => [] },
    selectField: { type: Object, default: null },
    allRecords: { type: Array, default: () => [] },
  },
  emits: ['deleteRecord', 'editRecord'],
  computed: {
    records() {
      if (!this.selectField || !this.column.value) return [];
      return this.allRecords.filter(r => r.data && r.data[this.selectField.name] === this.column.value);
    },
    titleField() {
      return this.fields.find(f => ['text', 'textarea'].includes(f.type))?.name || '';
    },
  },
  template: `
    <div class="kanban-col">
      <div class="kanban-col-header" :style="{ borderTopColor: column.color || '#4F46E5' }">
        <span class="kanban-col-title">{{ column.label || column.value || '(空)' }}</span>
        <span class="kanban-col-count">{{ records.length }}</span>
      </div>
      <div class="kanban-col-body">
        <div v-for="r in records" :key="r.id" class="kanban-card" @click="$emit('editRecord', r)">
          <div style="font-weight:600;font-size:14px;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ r.data && titleField ? (r.data[titleField] || '(无标题)') : '(无标题)' }}
          </div>
        </div>
        <div v-if="records.length === 0" style="text-align:center;padding:16px;font-size:13px;color:#9ca3af">暂无记录</div>
      </div>
    </div>
  `,
});

// 挂载应用
app.mount("#app");

console.log('[零搭] 组件库加载完成: StatsCard, AppCard, TableCard, ConfirmDialog, KanbanColumn');
