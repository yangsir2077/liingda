// StatsCard 组件 - 仪表盘统计卡片（渐变色背景）
// 用法: <StatsCard label="应用总数" :value="apps.length" gradient="purple" />

const GRADIENTS = {
  purple: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  green:  'linear-gradient(135deg, #059669, #10B981)',
  orange: 'linear-gradient(135deg, #D97706, #F59E0B)',
  red:    'linear-gradient(135deg, #DC2626, #EF4444)',
  blue:   'linear-gradient(135deg, #2563EB, #3B82F6)',
  pink:   'linear-gradient(135deg, #DB2777, #EC4899)',
};

const StatsCard = {
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
};

app.component('StatsCard', StatsCard);
