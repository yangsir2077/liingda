/**
 * 应用图标颜色映射
 */
export const ICON_COLORS: Record<string, { emoji: string; bg: string; color: string }> = {
  '文档': { emoji: '📄', bg: '#EEF2FF', color: '#4F46E5' },
  '客户': { emoji: '👤', bg: '#E0F2FE', color: '#0891B2' },
  '数据': { emoji: '📊', bg: '#D1FAE5', color: '#059669' },
  '项目': { emoji: '📋', bg: '#FEF3C7', color: '#D97706' },
  '日程': { emoji: '📅', bg: '#F3E8FF', color: '#7C3AED' },
  '财务': { emoji: '💰', bg: '#FEE2E2', color: '#DC2626' },
  '库存': { emoji: '📦', bg: '#FFEDD5', color: '#EA580C' },
  '行政': { emoji: '⚙️', bg: '#F1F5F9', color: '#64748B' },
  '客服': { emoji: '💬', bg: '#FCE7F3', color: '#DB2777' },
  '培训': { emoji: '🎓', bg: '#CCFBF1', color: '#0D9488' },
  '物流': { emoji: '🚚', bg: '#EDE9FE', color: '#9333EA' },
  '工具': { emoji: '🔧', bg: '#E2E8F0', color: '#475569' },
}

export function getIconData(label: string) {
  return ICON_COLORS[label] || ICON_COLORS['文档']
}
