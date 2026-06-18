import * as THREE from 'three'

const FORESHADOW_DURATION = 0.5
const FORESHADOW_AMPLITUDE_X = 0.06
const FORESHADOW_AMPLITUDE_ROLL = 0.12
const FORESHADOW_FREQUENCY = 48

function lerpLaneX(item, targetX, ctx) {
  const t = 1 - Math.exp(-ctx.laneSmooth * ctx.delta)
  item.position.x = THREE.MathUtils.lerp(item.position.x, targetX, t)
}

function isForeshadowing(item) {
  return (item.userData.foreshadowTimer ?? 0) > 0
}

function startForeshadow(item, nextLane) {
  item.userData.pendingLane = nextLane
  item.userData.foreshadowTimer = FORESHADOW_DURATION
  item.userData.foreshadowPhase = 0
}

function updateForeshadow(item, ctx) {
  applyForwardScroll(item, ctx)

  item.userData.foreshadowTimer -= ctx.delta
  item.userData.foreshadowPhase += ctx.delta * FORESHADOW_FREQUENCY * Math.PI * 2

  const baseX = ctx.getLaneX(item.userData.lane)
  item.position.x = baseX + Math.sin(item.userData.foreshadowPhase) * FORESHADOW_AMPLITUDE_X
  item.rotation.z =
    Math.sin(item.userData.foreshadowPhase * 1.7) * FORESHADOW_AMPLITUDE_ROLL

  if (item.userData.foreshadowTimer > 0) return false

  item.userData.targetLane = item.userData.pendingLane
  item.userData.lane = item.userData.pendingLane
  item.userData.pendingLane = null
  item.rotation.z = 0
  return true
}

function lerpToTargetLane(item, ctx) {
  item.userData.lane = item.userData.targetLane
  lerpLaneX(item, ctx.getLaneX(item.userData.targetLane), ctx)
  const t = 1 - Math.exp(-ctx.laneSmooth * ctx.delta)
  item.rotation.z = THREE.MathUtils.lerp(item.rotation.z, 0, t)
}

function applyForwardScroll(item, ctx) {
  const speedScale = item.userData.speedScale ?? 1
  const extraScroll =
    ctx.speed * ctx.delta * (ctx.itemMoveSpeedMultiplier - 1) * speedScale
  item.userData.trackZ -= extraScroll
  ctx.syncScrollObjectZ(item, ctx.worldScrollZ)
}

function pickRandomLane(ctx) {
  return Math.floor(Math.random() * ctx.laneCount)
}

function resolveSpawnLane(ctx) {
  if (ctx.spawnLane !== undefined) return ctx.spawnLane
  return pickRandomLane(ctx)
}

function pickAdjacentLane(lane, ctx) {
  const options = []
  if (lane > 0) options.push(lane - 1)
  if (lane < ctx.laneCount - 1) options.push(lane + 1)
  if (options.length === 0) return lane
  return options[Math.floor(Math.random() * options.length)]
}

const straight = {
  id: 'straight',
  weight: 3,
  assign(item, ctx) {
    const lane = resolveSpawnLane(ctx)
    item.userData.patternId = straight.id
    item.userData.lane = lane
    item.userData.speedScale = 1
    item.position.x = ctx.getLaneX(lane)
  },
  update(item, ctx) {
    applyForwardScroll(item, ctx)
    item.position.x = ctx.getLaneX(item.userData.lane)
  },
}

const laneSwitch = {
  id: 'lane_switch',
  weight: 2,
  assign(item, ctx) {
    const lane = resolveSpawnLane(ctx)
    item.userData.patternId = laneSwitch.id
    item.userData.lane = lane
    item.userData.targetLane = lane
    item.userData.switchTimer =
      (0.8 + Math.random() * 0.6) * (ctx.switchTimerScale ?? 1)
    item.userData.speedScale = 1
    item.position.x = ctx.getLaneX(lane)
  },
  update(item, ctx) {
    if (isForeshadowing(item)) {
      if (!updateForeshadow(item, ctx)) return
      item.userData.switchTimer =
        (0.9 + Math.random() * 0.5) * (ctx.switchTimerScale ?? 1)
      lerpToTargetLane(item, ctx)
      return
    }

    applyForwardScroll(item, ctx)

    item.userData.switchTimer -= ctx.delta
    if (item.userData.switchTimer <= 0) {
      startForeshadow(item, pickAdjacentLane(item.userData.targetLane, ctx))
      updateForeshadow(item, ctx)
      return
    }

    lerpToTargetLane(item, ctx)
  },
}

const zigzag = {
  id: 'zigzag',
  weight: 2,
  assign(item, ctx) {
    const startLane =
      ctx.spawnLane ?? (Math.random() < 0.5 ? 0 : ctx.laneCount - 1)
    item.userData.patternId = zigzag.id
    item.userData.lane = startLane
    item.userData.targetLane = startLane
    item.userData.switchTimer = 0.5 * (ctx.switchTimerScale ?? 1)
    item.userData.speedScale = 1
    item.position.x = ctx.getLaneX(startLane)
  },
  update(item, ctx) {
    if (isForeshadowing(item)) {
      if (!updateForeshadow(item, ctx)) return
      item.userData.switchTimer = 0.55 * (ctx.switchTimerScale ?? 1)
      lerpToTargetLane(item, ctx)
      return
    }

    applyForwardScroll(item, ctx)

    item.userData.switchTimer -= ctx.delta
    if (item.userData.switchTimer <= 0) {
      const direction = item.userData.targetLane <= 0 ? 1 : -1
      const nextLane = THREE.MathUtils.clamp(
        item.userData.targetLane + direction,
        0,
        ctx.laneCount - 1,
      )
      startForeshadow(item, nextLane)
      updateForeshadow(item, ctx)
      return
    }

    lerpToTargetLane(item, ctx)
  },
}

const wave = {
  id: 'wave',
  weight: 2,
  assign(item, ctx) {
    const lane = resolveSpawnLane(ctx)
    item.userData.patternId = wave.id
    item.userData.lane = lane
    item.userData.baseX = ctx.getLaneX(lane)
    item.userData.phase = Math.random() * Math.PI * 2
    item.userData.waveAmplitude = ctx.laneWidth * 0.9
    item.userData.waveSpeed = 2.2 + Math.random() * 0.8 + (ctx.waveSpeedBonus ?? 0)
    item.userData.speedScale = 1
    item.position.x = item.userData.baseX
  },
  update(item, ctx) {
    applyForwardScroll(item, ctx)
    item.userData.phase += ctx.delta * item.userData.waveSpeed
    item.position.x =
      item.userData.baseX + Math.sin(item.userData.phase) * item.userData.waveAmplitude
  },
}

const slow = {
  id: 'slow',
  weight: 1,
  assign(item, ctx) {
    straight.assign(item, ctx)
    item.userData.patternId = slow.id
    item.userData.speedScale = 0.7
  },
  update(item, ctx) {
    straight.update(item, ctx)
  },
}

const fast = {
  id: 'fast',
  weight: 1,
  assign(item, ctx) {
    straight.assign(item, ctx)
    item.userData.patternId = fast.id
    item.userData.speedScale = 1.4
  },
  update(item, ctx) {
    straight.update(item, ctx)
  },
}

const PATTERN_LIST = [straight, laneSwitch, zigzag, wave, slow, fast]

const PATTERN_MAP = Object.fromEntries(PATTERN_LIST.map((pattern) => [pattern.id, pattern]))

function getPatternWeight(pattern, difficultyLevel) {
  let weight = pattern.weight
  if (difficultyLevel <= 0) return weight

  switch (pattern.id) {
    case 'straight':
      return weight * Math.max(0.25, 1 - difficultyLevel * 0.1)
    case 'slow':
      return weight * Math.max(0, 1 - difficultyLevel * 0.25)
    case 'lane_switch':
    case 'zigzag':
      return weight * (1 + difficultyLevel * 0.3)
    case 'fast':
      return weight * (1 + difficultyLevel * 0.25)
    case 'wave':
      return weight * (1 + difficultyLevel * 0.2)
    default:
      return weight
  }
}

export function pickDarumaPattern(difficultyLevel = 0) {
  const weightedPatterns = PATTERN_LIST.map((pattern) => ({
    pattern,
    weight: getPatternWeight(pattern, difficultyLevel),
  }))
  const totalWeight = weightedPatterns.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of weightedPatterns) {
    roll -= entry.weight
    if (roll <= 0) return entry.pattern
  }

  return straight
}

export function assignDarumaPattern(item, pattern, ctx) {
  pattern.assign(item, ctx)
}

export function updateDarumaPattern(item, ctx) {
  const pattern = PATTERN_MAP[item.userData.patternId] ?? straight
  pattern.update(item, ctx)
}

export function clearDarumaPatternState(item) {
  delete item.userData.patternId
  delete item.userData.lane
  delete item.userData.targetLane
  delete item.userData.switchTimer
  delete item.userData.baseX
  delete item.userData.phase
  delete item.userData.waveAmplitude
  delete item.userData.waveSpeed
  delete item.userData.speedScale
  delete item.userData.foreshadowTimer
  delete item.userData.foreshadowPhase
  delete item.userData.pendingLane
}

export { PATTERN_LIST, PATTERN_MAP }