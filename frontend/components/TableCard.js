// TableCard 组件 - 数据表卡片
// 用法: <TableCard :table="table" @delete="deleteTable(table)" @click="openTable(table)" />

const TableCard = {
  name: 'TableCard',
  props: {
    table: { type: Object, required: true },
  },
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
          style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px;font-weight:600;padding:4px 8px;opacity:0.7">
          删除
        </button>
      </div>
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        {{ table.name }}
      </div>
      <div style="font-size:12px;color:var(--text-secondary)">
        {{ table.field_count || 0 }} 个字段 · {{ table.record_count || 0 }} 条记录
      </div>
    </div>
  `,
};

app.component('TableCard', TableCard);
