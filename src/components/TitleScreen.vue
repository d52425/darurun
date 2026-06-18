<script setup>
defineEmits(['start'])
</script>

<template>
  <div class="title-screen" @click="$emit('start')">
    <div class="title-bg" aria-hidden="true">
      <div class="title-bg-grid" />
      <div class="title-bg-glow title-bg-glow--left" />
      <div class="title-bg-glow title-bg-glow--right" />
    </div>

    <div class="title-content">
      <p class="title-eyebrow">DARUMA DODGE RUNNER</p>
      <h1 class="title-logo">
        <span class="title-logo-main">MANDORA</span>
        <span class="title-logo-sub">GAME</span>
      </h1>
      <p class="title-tagline">だるまをよけて、1000mを目指せ！</p>

      <button class="title-start" type="button" @click.stop="$emit('start')">
        START
      </button>
      <p class="title-prompt">
        <span class="title-prompt-key">SPACE</span>
        or click to play
      </p>

      <ul class="title-controls">
        <li><kbd>A</kbd> <kbd>D</kbd> レーン移動</li>

        <li><kbd>C</kbd> カメラ切替</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.title-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.title-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #5eb8e8 0%, #87ceeb 38%, #b8e4f8 100%);
}

.title-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%);
  opacity: 0.45;
  animation: grid-drift 12s linear infinite;
}

.title-bg-glow {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  animation: glow-float 6s ease-in-out infinite;
}

.title-bg-glow--left {
  left: -80px;
  top: 120px;
  background: #ff6b6b;
}

.title-bg-glow--right {
  right: -60px;
  bottom: 80px;
  background: #44ff88;
  animation-delay: -3s;
}

.title-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.25rem;
  color: #0a2540;
}

.title-eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(10, 37, 64, 0.65);
}

.title-logo {
  margin: 0;
  line-height: 0.95;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.title-logo-main {
  font-size: 3.2rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  color: #fff;
  text-shadow:
    0 4px 0 #1a6fa8,
    0 8px 24px rgba(10, 37, 64, 0.35);
  animation: title-bounce 2.4s ease-in-out infinite;
}

.title-logo-sub {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: 0.35em;
  padding-left: 0.35em;
  color: #ff4757;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.8);
}

.title-tagline {
  margin: 1rem 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(10, 37, 64, 0.85);
}

.title-start {
  margin: 0;
  padding: 0.85rem 3rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #ff6b6b 0%, #ee5253 100%);
  color: #fff;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  cursor: pointer;
  box-shadow:
    0 4px 0 #c0392b,
    0 8px 24px rgba(192, 57, 43, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.title-start:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 0 #c0392b,
    0 12px 28px rgba(192, 57, 43, 0.45);
}

.title-start:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 #c0392b,
    0 4px 12px rgba(192, 57, 43, 0.35);
}

.title-prompt {
  margin: 1rem 0 0;
  font-size: 0.95rem;
  color: rgba(10, 37, 64, 0.7);
  animation: prompt-blink 1.6s ease-in-out infinite;
}

.title-prompt-key {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.75);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.title-controls {
  margin: 2rem 0 0;
  padding: 0.85rem 1rem;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  font-size: 0.82rem;
  font-weight: 600;
}

.title-controls kbd {
  display: inline-block;
  min-width: 1.4rem;
  margin-right: 0.15rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: rgba(10, 37, 64, 0.12);
  border: 1px solid rgba(10, 37, 64, 0.2);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
}

@keyframes title-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes prompt-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@keyframes grid-drift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(48px);
  }
}

@keyframes glow-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.08);
  }
}
</style>