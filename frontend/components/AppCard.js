// AppCard 组件 - 应用卡片（支持滑出删除按钮）
// 用法: <AppCard :app="app" @delete="deleteApp(app)" @click="openApp(app)" />

const AppCard = {
  name: 'AppCard',
  props: {
    app: { type: Object, required: true },
  },
  emits: ['delete', 'click'],
  setup(props, { emit }) {
    const swipedId = ref(null);
    const transitioning = ref(false);
    let touchStartX = 0, touchStartY = 0, didSwipe = false, clickBlocked = false;

    function handleClick() {
      if (clickBlocked) { clickBlocked = false; return; }
      swipedId.value = null;
      emit('click', props.app);
    }

    function onTouchStart(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      didSwipe = false;
      transitioning.value = false;
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
      if (!didSwipe) {
        swipedId.value = null;
        e.currentTarget.style.transform = '';
      } else {
        clickBlocked = true;
        if (dx < -40) {
          e.currentTarget.style.transform = 'translateX(-80px)';
          swipedId.value = props.app.id;
        } else {
          e.currentTarget.style.transform = '';
          swipedId.value = null;
        }
      }
    }

    return { swipedId, transitioning, handleClick, onTouchStart, onTouchMove, onTouchEnd };
  },
  template: `
    <div class="app-card-wrapper" style="position:relative;overflow:hidden;border-radius:12px;margin-bottom:0">
      <!-- 滑出的删除区域 -->
      <div v-if="swipedId === app.id"
        @click="swipedId = null"
        style="position:absolute;top:0;right:0;bottom:0;width:80px;background:#DC2626;display:flex;align-items:center;justify-content:center;z-index:0;border-radius:12px">
        <button @click.stop="$emit('delete', app)"
          style="background:none;border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4;padding:0">
          删<br>除
        </button>
      </div>

      <!-- 卡片主体 -->
      <div class="app-card"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @click="handleClick"
        :style="{
          transform: swipedId === app.id ? 'translateX(-80px)' : 'translateX(0)',
          transition: transitioning ? 'transform 0.3s' : 'none',
          position: 'relative',
          zIndex: 1
        }">
        <div class="app-card-icon"
          :style="{ background: (ICON_MAP[app.icon] || ICON_OPTIONS[0]).bg, color: (ICON_MAP[app.icon] || ICON_OPTIONS[0]).color }"
          v-html="(ICON_MAP[app.icon] || ICON_OPTIONS[0]).svg">
        </div>
        <div class="app-card-name">{{ app.name }}</div>
        <div class="app-card-desc">{{ app.description || '暂无描述' }}</div>
        <div class="app-card-meta">
          <span>{{ app.table_count }} 个数据表</span>
          <button @click.stop="$emit('delete', app)"
            style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:13px;font-weight:600;padding:0;margin-left:auto">
            删除
          </button>
        </div>
      </div>
    </div>
  `,
};

app.component('AppCard', AppCard);
