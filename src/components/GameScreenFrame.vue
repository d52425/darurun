<script setup>
defineProps({
  zIndex: {
    type: Number,
    default: 50,
  },
  passThrough: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="screen-stage" :style="{ zIndex }">
    <div class="screen-viewport" :class="{ 'screen-viewport--pass-through': passThrough }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.screen-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.screen-viewport {
  position: absolute;
  top: 0;
  left: 0;
  width: 720px;
  height: 1280px;
  transform: scale(var(--game-ui-scale, 1));
  transform-origin: top left;
  pointer-events: auto;
  will-change: transform;
}

.screen-viewport--pass-through,
.screen-viewport--pass-through * {
  pointer-events: none;
}
</style>