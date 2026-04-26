// RecordCard 组件 - 画廊视图的记录卡片
// 用法: <RecordCard :record="record" :fields="fields" :titleField="titleField" :selectField="selectField" @delete="deleteRecord(record)" />

const RecordCard = {
  name: 'RecordCard',
  props: {
    record: { type: Object, required: true },
    fields: { type: Array, default: () => [] },
    titleField: { type: String, default: '' },
    selectField: { type: Object, default: null },
    showFields: { type: Array, default: () => [] },
  },
  emits: ['delete'],
  computed: {
    title() {
      if (!this.titleField || !this.record.fields) return '(无标题)';
      return this.record.fields[this.titleField] || '(无标题)';
    },
    cardColor() {
      if (!this.selectField || !this.record.fields) return '';
      const val = this.record.fields[this.selectField.name];
      if (!val) return '';
      const opt = this.selectField.options?.find(o => o.label === val);
      return opt?.color || '';
    },
    bgStyle() {
      return this.cardColor ? { borderLeft: `4px solid ${this.cardColor}` } : {};
    },
    displayFields() {
      if (!this.fields || !this.showFields?.length) return [];
      return this.fields
        .filter(f => this.showFields.includes(f.name) && f.name !== this.titleField && f.name !== this.selectField?.name && f.type !== 'desc' && f.type !== 'separator')
        .slice(0, 3);
    },
  },
  template: `
    <div class="record-card" :style="bgStyle">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          {{ title }}
        </div>
        <button @click.stop="$emit('delete', record)"
          style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:12px;padding:2px 6px;opacity:0.6;flex-shrink:0">
          删除
        </button>
      </div>
      <div v-for="f in displayFields" :key="f.name" style="display:flex;gap:8px;margin-bottom:4px;font-size:13px">
        <span style="color:var(--text-secondary);flex-shrink:0;min-width:60px">{{ f.label }}:</span>
        <span style="color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          {{ formatValue(record.fields[f.name], f) }}
        </span>
      </div>
      <div v-if="selectField && record.fields && record.fields[selectField.name]"
        style="margin-top:8px;display:flex;align-items:center;gap:6px">
        <span class="badge" :style="{ background: cardColor + '22', color: cardColor }">
          {{ record.fields[selectField.name] }}
        </span>
      </div>
    </div>
  `,
  methods: {
    formatValue(val, field) {
      if (val === null || val === undefined) return '-';
      if (field.type === 'checkbox') return val ? '✓' : '✗';
      if (field.type === 'date' && val) return val.slice(0, 10);
      return String(val);
    },
  },
};

app.component('RecordCard', RecordCard);
