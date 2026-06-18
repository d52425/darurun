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
  rewardMilestone: {
    type: Number,
    default: 0,
  },
  rewardMessage: {
    type: String,
    default: '',
  },
})

defineEmits(['retry', 'title'])
</script>

<template>
  <div class="game-over-screen">
    <div class="game-over-bg" aria-hidden="true">
      <div class="game-over-bg-vignette" />
      <div class="game-over-bg-pulse" />
    </div>

    <div class="game-over-content">
      <p class="game-over-eyebrow">CRASHED INTO DARUMA</p>
      <h2 class="game-over-heading">GAME OVER</h2>

      <div class="game-over-score">
        <span class="game-over-score-label">DISTANCE</span>
        <span class="game-over-score-value">{{ score }}<small>m</small></span>
        <span class="game-over-score-goal">Goal: {{ goal }}m</span>
      </div>

      <div v-if="rewardMessage" class="game-over-reward">
        <span class="game-over-reward-label">
          {{ rewardMilestone > 0 ? `${rewardMilestone}m ご褒美` : 'MESSAGE' }}
        </span>
        <p class="game-over-reward-message">{{ rewardMessage }}</p>
      </div>

      <div class="game-over-actions">
        <button class="game-over-btn game-over-btn--primary" type="button" @click="$emit('retry')">
          RETRY
        </button>
        <button class="game-over-btn game-over-btn--secondary" type="button" @click="$emit('title')">
          TITLE
        </button>
      </div>

      <p class="game-over-prompt">
        <span class="game-over-prompt-key">SPACE</span> retry
        <span class="game-over-prompt-divider">/</span>
        <span class="game-over-prompt-key">ESC</span> title
      </p>
    </div>
  </div>
</template>

<style scoped>
.game-over-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.game-over-bg {
  position: absolute;
  inset: 0;
  background: rgba(8, 12, 24, 0.72);
  backdrop-filter: blur(3px);
}

.game-over-bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 20%,
    rgba(120, 20, 30, 0.55) 100%
  );
}

.game-over-bg-pulse {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, rgba(255, 70, 70, 0.25), transparent 55%);
  animation: game-over-pulse 2.2s ease-in-out infinite;
}

.game-over-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  width: 88%;
  max-width: 100%;
  padding: 1.6rem 1rem;
}

.game-over-eyebrow {
  margin: 0 0 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(255, 180, 180, 0.85);
}

.game-over-heading {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #ff4757;
  text-shadow:
    0 3px 0 #9b1c31,
    0 0 32px rgba(255, 71, 87, 0.55);
  animation: game-over-shake 0.45s ease-in-out 0.1s both;
}

.game-over-score {
  margin: 1.5rem 0 1.5rem;
  padding: 0.9rem 1rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.game-over-score-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.65);
}

.game-over-score-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.game-over-score-value small {
  margin-left: 0.15rem;
  font-size: 0.55em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
}

.game-over-score-goal {
  margin-top: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}

.game-over-reward {
  margin: 0 0 1.5rem;
  padding: 0.9rem 1rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  background: rgba(255, 213, 79, 0.12);
  border: 1px solid rgba(255, 213, 79, 0.45);
}

.game-over-reward-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #ffd54f;
}

.game-over-reward-message {
  margin: 0.5rem 0 0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.55;
  color: #fff;
  overflow-wrap: anywhere;
}

.game-over-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.game-over-btn {
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

.game-over-btn--primary {
  background: linear-gradient(180deg, #ff6b6b 0%, #ee5253 100%);
  color: #fff;
  box-shadow:
    0 4px 0 #c0392b,
    0 8px 24px rgba(192, 57, 43, 0.4);
}

.game-over-btn--primary:hover {
  transform: translateY(-2px);
}

.game-over-btn--primary:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 #c0392b,
    0 4px 12px rgba(192, 57, 43, 0.35);
}

.game-over-btn--secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: none;
}

.game-over-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.18);
}

.game-over-prompt {
  margin: 1.25rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
  animation: prompt-blink 1.6s ease-in-out infinite;
}

.game-over-prompt-key {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.game-over-prompt-divider {
  margin: 0 0.35rem;
  opacity: 0.5;
}

@keyframes game-over-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

@keyframes game-over-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
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