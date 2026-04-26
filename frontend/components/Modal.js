// Modal 组件 - 通用模态框包装
// 用法: <Modal :show="showCreate" title="新建应用" @close="showCreate = false">
//         <template #default>内容</template>
//       </Modal>

const Modal = {
  name: 'Modal',
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: String, default: '520px' },
  },
  emits: ['close'],
  template: `
    <Teleport to="body">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal" :style="{ maxWidth: width }">
          <div class="modal-header">
            <div class="modal-title">{{ title }}</div>
            <button class="modal-close" @click="$emit('close')">×</button>
          </div>
          <slot />
        </div>
      </div>
    </Teleport>
  `,
};

app.component('Modal', Modal);
