import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // Game state
  const crabs = ref([])
  const score = ref(0)
  const isPlaying = ref(false)
  
  // Initialize game - return empty array to avoid errors
  function initGame() {
    crabs.value = []
    score.value = 0
    isPlaying.value = true
    
    // Create initial crabs after initialization
    setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        addCrab(i)
      }
    }, 0)
  }
  
  function addCrab(index) {
    const crabId = index.toString()
    crabs.value.push({
      id: crabId,
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 2 + 0.5,
      z: (Math.random() - 0.5) * 20,
      wiggleSpeed: 0.01 + Math.random() * 0.01,
      wigglePhase: Math.random() * Math.PI * 2
    })
  }
  
  function updateCrabs(deltaTime) {
    if (crabs.value.length === 0) return
    
    crabs.value.forEach(crab => {
      // Wiggle animation - only modify properties that exist
      if (crab.y !== undefined && crab.wiggleSpeed !== undefined && crab.wigglePhase !== undefined) {
        crab.y += Math.sin(Date.now() * 0.002 + crab.wigglePhase) * 0.01 * crab.wiggleSpeed
        
        // Rotate for visual effect - only if rotation exists
        if (crab.rotation && typeof crab.rotation === 'object') {
          crab.rotation.x = Math.sin(Date.now() * 0.003 + crab.wigglePhase) * 0.5
          crab.rotation.z = Math.cos(Date.now() * 0.003 + crab.wigglePhase) * 0.5
        }
      }
    })
  }
  
  function addScore(points) {
    score.value += points
  }
  
  function resetGame() {
    initGame()
  }
  
  return {
    crabs,
    score,
    isPlaying,
    initGame,
    updateCrabs,
    addScore,
    resetGame
  }
})
