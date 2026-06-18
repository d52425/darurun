<script setup>
defineProps({
  score: {
    type: Number,
    default: 0,
  },
  goal: {
    type: Number,
    default: 1000,
  },
})

defineEmits(['retry', 'title'])
</script>

<template>
  <div class="goal-clear-screen">
    <div class="goal-clear-bg" aria-hidden="true">
      <div class="goal-clear-bg-rays" />
      <div class="goal-clear-bg-sparkle goal-clear-bg-sparkle--left" />
      <div class="goal-clear-bg-sparkle goal-clear-bg-sparkle--right" />
    </div>

    <div class="goal-clear-content">
      <p class="goal-clear-eyebrow">MANDORA MADE IT</p>
      <h2 class="goal-clear-heading">GOAL!!</h2>
      <p class="goal-clear-subtitle">{{ goal }}m 達成！</p>

      <div class="goal-clear-score">
        <span class="goal-clear-score-label">DISTANCE</span>
        <span class="goal-clear-score-value">{{ score }}<small>m</small></span>
      </div>

      <div class="goal-clear-actions">
        <button class="goal-clear-btn goal-clear-btn--primary" type="button" @click="$emit('retry')">
          PLAY AGAIN
        </button>
        <button class="goal-clear-btn goal-clear-btn--secondary" type="button" @click="$emit('title')">
          TITLE
        </button>
      </div>

      <p class="goal-clear-prompt">
        <span class="goal-clear-prompt-key">SPACE</span> play again
        <span class="goal-clear-prompt-divider">/</span>
        <span class="goal-clear-prompt-key">ESC</span> title
      </p>
    </div>
  </div>
</template>

<style scoped>
.goal-clear-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.goal-clear-bg {
  position: absolute;
  inset: 0;
  background: rgba(8, 24, 18, 0.75);
  backdrop-filter: blur(3px);
}

.goal-clear-bg-rays {
  position: absolute;
  inset: -20%;
  background: conic-gradient(
    from 0deg at 50% 45%,
    transparent 0deg,
    rgba(255, 215, 80, 0.18) 20deg,
    transparent 40deg,
    rgba(68, 255, 136, 0.14) 70deg,
    transparent 100deg,
    rgba(255, 215, 80, 0.18) 140deg,
    transparent 180deg,
    rgba(68, 255, 136, 0.14) 220deg,
    transparent 260deg,
    rgba(255, 215, 80, 0.18) 300deg,
    transparent 360deg
  );
  animation: goal-rays-spin 10s linear infinite;
}

.goal-clear-bg-sparkle {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.6;
  animation: goal-sparkle-float 5s ease-in-out infinite;
}

.goal-clear-bg-sparkle--left {
  left: -40px;
  top: 100px;
  background: #44ff88;
}

.goal-clear-bg-sparkle--right {
  right: -30px;
  bottom: 120px;
  background: #ffd54f;
  animation-delay: -2.5s;
}

.goal-clear-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
  width: min(92%, 420px);
}

.goal-clear-eyebrow {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(180, 255, 210, 0.9);
}

.goal-clear-heading {
  margin: 0;
  font-size: 3.2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #ffd54f;
  text-shadow:
    0 3px 0 #c9a227,
    0 0 36px rgba(255, 213, 79, 0.6);
  animation: goal-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.goal-clear-subtitle {
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #7dffb0;
}

.goal-clear-score {
  margin: 1.75rem 0 2rem;
  padding: 1rem 2rem;
  width: 100%;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(125, 255, 176, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.goal-clear-score-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.65);
}

.goal-clear-score-value {
  font-size: 2.6rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.goal-clear-score-value small {
  margin-left: 0.15rem;
  font-size: 0.55em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
}

.goal-clear-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.goal-clear-btn {
  width: 100%;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.goal-clear-btn--primary {
  background: linear-gradient(180deg, #5dffb0 0%, #2ecc71 100%);
  color: #0a3020;
  box-shadow:
    0 4px 0 #1e9e57,
    0 8px 24px rgba(46, 204, 113, 0.4);
}

.goal-clear-btn--primary:hover {
  transform: translateY(-2px);
}

.goal-clear-btn--primary:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 #1e9e57,
    0 4px 12px rgba(46, 204, 113, 0.35);
}

.goal-clear-btn--secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.goal-clear-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.18);
}

.goal-clear-prompt {
  margin: 1.25rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
  animation: prompt-blink 1.6s ease-in-out infinite;
}

.goal-clear-prompt-key {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.goal-clear-prompt-divider {
  margin: 0 0.35rem;
  opacity: 0.5;
}

@keyframes goal-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes goal-rays-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes goal-sparkle-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-18px) scale(1.06);
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
</style>