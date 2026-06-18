export const DIFFICULTY_DISTANCE_INTERVAL = 100

const BASE_SPAWN_INTERVAL = 1.2
const MIN_SPAWN_INTERVAL = 0.45
const BASE_ITEM_MOVE_SPEED_MULTIPLIER = 2
const MAX_ITEM_MOVE_SPEED_MULTIPLIER = 4.5
const BASE_TRIPLE_SPAWN_EVERY = 10
const MIN_TRIPLE_SPAWN_EVERY = 4

export function getDifficultyLevel(distance) {
  return Math.floor(Math.max(0, distance) / DIFFICULTY_DISTANCE_INTERVAL)
}

export function getDifficultySettings(distance) {
  const level = getDifficultyLevel(distance)

  return {
    level,
    spawnInterval: Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - level * 0.08),
    itemMoveSpeedMultiplier: Math.min(
      MAX_ITEM_MOVE_SPEED_MULTIPLIER,
      BASE_ITEM_MOVE_SPEED_MULTIPLIER + level * 0.25,
    ),
    tripleSpawnEvery: Math.max(MIN_TRIPLE_SPAWN_EVERY, BASE_TRIPLE_SPAWN_EVERY - level),
    spawnDistanceMin: Math.max(12, 18 - level * 0.6),
    spawnDistanceMax: Math.max(20, 32 - level * 1),
    switchTimerScale: Math.max(0.5, 1 - level * 0.06),
    waveSpeedBonus: level * 0.15,
  }
}