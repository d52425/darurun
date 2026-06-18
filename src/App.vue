<script setup>
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

import GameOverScreen from './components/GameOverScreen.vue'
import GameScreenFrame from './components/GameScreenFrame.vue'
import GoalClearScreen from './components/GoalClearScreen.vue'
import TitleScreen from './components/TitleScreen.vue'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'

import { useGameStore } from './stores/game'
import { convertVideoForX } from './utils/convertVideoForX'
import {
  cloneItemFromPrototype,
  createItemPrototypeFromVrm,
  scaleVrmPrototypeToSize,
} from './utils/createStaticVrmPrototype'
import { loadMixamoAnimation } from './utils/loadMixamoAnimation'
import {
  assignDarumaPattern,
  clearDarumaPatternState,
  pickDarumaPattern,
  updateDarumaPattern,
} from './utils/darumaMovementPatterns'
import { getDifficultySettings } from './utils/difficulty'
import { getRewardMessageForScore } from './utils/milestoneMessages'
import {
  advanceWorldScroll,
  createTrackSpawnZ,
  getFloorScrollOffset,
  registerScrollableObject,
  syncAllScrollObjects,
  syncScrollObjectZ,
  unregisterScrollableObject,
  wrapWorldScroll,
} from './utils/worldScroll'

const GAME_WIDTH = 720
const GAME_HEIGHT = 1280
const GAME_ASPECT = GAME_WIDTH / GAME_HEIGHT

const RUN_MOTION = '/motions/F_Run_001.fbx'
const MOVE_SPEED = 3.5

const PLAYER_SCALE = 0.5

const CAMERA_DISTANCE = 2.0
const CAMERA_HEIGHT = 3.3
const LOOK_AT_HEIGHT = 1.1
const OVERVIEW_CAMERA_DISTANCE = 14
const OVERVIEW_CAMERA_HEIGHT = 9
const CAMERA_SMOOTH = 10.0
const LIGHT_DISTANCE = 3.5
const LIGHT_HEIGHT = 4.5
const LIGHT_SIDE = 1.5
const FLOOR_SIZE = 100
const FLOOR_SEGMENTS = 100
const LANE_WIDTH = 1
const LANE_COUNT = 3
const LANE_SMOOTH = 15
const ITEM_SPAWN_INTERVAL = 1.2
const ITEM_SPAWN_DISTANCE_MIN = 18
const ITEM_SPAWN_DISTANCE_MAX = 32
const ITEM_DESPAWN_DISTANCE = 6
const ITEM_SIZE = 0.45
const ITEM_FACING_Y = Math.PI
const ITEM_MOVE_SPEED_MULTIPLIER = 2
const ITEM_COLLECT_Z = 0.9
const ITEM_COLLECT_X = 0.55
const HITBOX_HEIGHT = 1.2
const HITBOX_Y = HITBOX_HEIGHT / 2
const PLAYER_HIT_SIZE = 0.3
const PLAYER_HIT_HALF_X = PLAYER_HIT_SIZE / 2
const PLAYER_HIT_HALF_Z = PLAYER_HIT_SIZE / 2
const PLAYER_HITBOX_HEIGHT = PLAYER_HIT_SIZE
const PLAYER_HITBOX_Y = PLAYER_HITBOX_HEIGHT / 2
const ITEM_POOL_SIZE = 12
const TRIPLE_SPAWN_EVERY = 10
const TRIPLE_COUNT = 3
const TRIPLE_Z_SPACING = 2.2
const GOAL_DISTANCE = 1000

const canvasRef = ref(null)
let layoutObserver = null

function updateGameLayout() {
  const container = canvasRef.value
  if (!container) return

  const { width, height } = container.getBoundingClientRect()
  const layoutWidth = Math.round(width)
  const layoutHeight = Math.round(height)
  if (layoutWidth <= 0 || layoutHeight <= 0) return

  container.style.setProperty('--game-ui-scale', String(layoutWidth / GAME_WIDTH))

  if (renderer && camera) {
    camera.aspect = layoutWidth / layoutHeight
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(layoutWidth, layoutHeight)
  }
}

const currentLane = ref(1)
const isOverviewCamera = ref(false)
const distanceScore = ref(0)
const difficultyLevel = ref(0)
const isGameOver = ref(false)
const isGoalReached = ref(false)
const gamePhase = ref('title')
const showHitboxes = ref(false)
const recordingStatus = ref('Idle')
const convertProgress = ref(0)
const gameOverReward = ref({
  milestone: 0,
  message: '',
})

const gameStore = useGameStore()
let scene
let camera
let renderer
let directionalLight = null
let characterRoot = null
let floorGroup = null
let floorGrid = null
let floorOcean = null
let worldGroup = null
let itemGroup = null
let items = []
let scrollableObjects = []
let itemPrototype = null
let itemPool = []
let playerHitbox = null
let itemSpawnTimer = 0
let spawnWaveCount = 0
let worldScrollZ = 0
let totalDistance = 0
let difficultySettings = getDifficultySettings(0)
let vrmModel = null
let mediaRecorder = null
let recordedChunks = []
let mixer = null
let currentAction = null
let clock = new THREE.Clock()
let positionLogTimer = 0
let cameraReady = false
const characterWorldPos = new THREE.Vector3()
const lookAtTarget = new THREE.Vector3()
const desiredCameraPos = new THREE.Vector3()
const characterForward = new THREE.Vector3()

async function playMotion(vrm) {
  const clip = await loadMixamoAnimation(RUN_MOTION, vrm)

  if (!mixer) {
    mixer = new THREE.AnimationMixer(vrm.scene)
  }

  if (currentAction) {
    currentAction.stop()
  }

  currentAction = mixer.clipAction(clip)
  currentAction.reset().play()

  console.log('▶ Playing run motion')
}

function getCharacterForward(target) {
  target.set(0, 0, 1)
  target.applyQuaternion(characterRoot.quaternion)
  target.y = 0
  target.normalize()
  return target
}

function getLaneX(lane) {
  return -(lane - 1) * LANE_WIDTH
}

function changeLane(direction) {
  if (isGameOver.value || isGoalReached.value) return

  const next = currentLane.value + direction
  if (next < 0 || next >= LANE_COUNT) return

  currentLane.value = next
}

function triggerGameOver() {
  if (isGameOver.value || isGoalReached.value) return
  isGameOver.value = true
  gameOverReward.value = getRewardMessageForScore(distanceScore.value)
  console.log('💥 Game Over!')
}

function triggerGoalReached() {
  if (isGoalReached.value || isGameOver.value) return
  isGoalReached.value = true
  totalDistance = GOAL_DISTANCE
  distanceScore.value = GOAL_DISTANCE
  console.log('🎉 Goal reached!')
}

function clearAllItems() {
  while (items.length > 0) {
    removeItem(0)
  }
}

function syncDifficulty() {
  difficultySettings = getDifficultySettings(totalDistance)
  difficultyLevel.value = difficultySettings.level
}

function resetPlayerState() {
  worldScrollZ = 0
  totalDistance = 0
  distanceScore.value = 0
  itemSpawnTimer = 0
  spawnWaveCount = 0
  currentLane.value = 1
  gameOverReward.value = { milestone: 0, message: '' }
  syncDifficulty()

  if (characterRoot) {
    characterRoot.position.set(0, 0, 0)
    characterRoot.rotation.z = 0
  }
}

function startGame() {
  if (gamePhase.value !== 'title') return

  gamePhase.value = 'playing'
  resetGame()
}

function returnToTitle() {
  clearAllItems()
  isGameOver.value = false
  isGoalReached.value = false
  resetPlayerState()
  gamePhase.value = 'title'
}

function resetGame() {
  clearAllItems()
  isGameOver.value = false
  isGoalReached.value = false
  resetPlayerState()

  if (itemPrototype) {
    for (let i = 0; i < 6; i++) {
      spawnDarumaSingle()
    }
  }
}

function getMoveSpeed() {
  return MOVE_SPEED
}

function updateCharacterMovement(delta) {
  if (!characterRoot) return

  const targetX = getLaneX(currentLane.value)
  const t = 1 - Math.exp(-LANE_SMOOTH * delta)
  characterRoot.position.x = THREE.MathUtils.lerp(characterRoot.position.x, targetX, t)
  characterRoot.position.y = 0
  characterRoot.position.z = 0
  characterRoot.rotation.z = THREE.MathUtils.lerp(characterRoot.rotation.z, 0, t)
}

function updateWorldScroll(delta) {
  if (gamePhase.value !== 'playing' || isGameOver.value || isGoalReached.value) return

  const speed = getMoveSpeed()
  totalDistance += speed * delta

  if (totalDistance >= GOAL_DISTANCE) {
    triggerGoalReached()
    return
  }

  distanceScore.value = Math.floor(totalDistance)
  syncDifficulty()
  worldScrollZ = advanceWorldScroll(worldScrollZ, delta, speed)
  worldScrollZ = wrapWorldScroll(worldScrollZ, scrollableObjects)
  syncAllScrollObjects(scrollableObjects, worldScrollZ)

  if (floorGrid) {
    const floorOffsetZ = getFloorScrollOffset(worldScrollZ)
    floorGrid.position.z = floorOffsetZ
    if (floorOcean) {
      floorOcean.position.z = floorOffsetZ
    }
  }
}

function updateTPSCamera(delta) {
  if (!characterRoot) return

  characterRoot.getWorldPosition(characterWorldPos)

  getCharacterForward(characterForward)

  const cameraDistance = isOverviewCamera.value
    ? OVERVIEW_CAMERA_DISTANCE
    : CAMERA_DISTANCE
  const cameraHeight = isOverviewCamera.value
    ? OVERVIEW_CAMERA_HEIGHT
    : CAMERA_HEIGHT

  desiredCameraPos
    .copy(characterWorldPos)
    .addScaledVector(characterForward, -cameraDistance)
  desiredCameraPos.y += cameraHeight

  lookAtTarget.set(
    characterWorldPos.x,
    characterWorldPos.y + LOOK_AT_HEIGHT,
    characterWorldPos.z,
  )

  if (!cameraReady) {
    camera.position.copy(desiredCameraPos)
    cameraReady = true
  } else {
    const t = 1 - Math.exp(-CAMERA_SMOOTH * delta)
    camera.position.lerp(desiredCameraPos, t)
  }

  camera.lookAt(lookAtTarget)
}

function updatePlayerLight() {
  if (!characterRoot || !directionalLight) return

  characterRoot.getWorldPosition(characterWorldPos)
  getCharacterForward(characterForward)

  directionalLight.position
    .copy(characterWorldPos)
    .addScaledVector(characterForward, -LIGHT_DISTANCE)
  directionalLight.position.y += LIGHT_HEIGHT
  directionalLight.position.x += LIGHT_SIDE

  directionalLight.target.position.set(
    characterWorldPos.x,
    characterWorldPos.y + LOOK_AT_HEIGHT,
    characterWorldPos.z,
  )
}

function acquireItem() {
  return itemPool.find((item) => !item.userData.active) ?? null
}

function releaseItem(item) {
  unregisterScrollableObject(scrollableObjects, item)
  clearDarumaPatternState(item)
  item.userData.active = false
  item.visible = false
  item.position.set(0, itemPrototype?.position.y ?? 0, 0)
  item.rotation.set(0, ITEM_FACING_Y, 0)
}

function createHitboxMesh(color, halfWidth, halfDepth, height) {
  const geometry = new THREE.BoxGeometry(halfWidth * 2, height, halfDepth * 2)
  const material = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = height / 2
  mesh.visible = false
  return mesh
}

function updateHitboxDisplay() {
  if (playerHitbox) {
    playerHitbox.visible = showHitboxes.value

    if (characterRoot && showHitboxes.value) {
      playerHitbox.position.set(
        characterRoot.position.x,
        PLAYER_HITBOX_Y,
        characterRoot.position.z,
      )
    }
  }

  for (const item of itemPool) {
    if (item.userData.hitbox) {
      item.userData.hitbox.visible = showHitboxes.value && item.visible
    }
  }
}

function createDarumaContext(delta, speed) {
  return {
    delta,
    speed,
    worldScrollZ,
    laneCount: LANE_COUNT,
    laneWidth: LANE_WIDTH,
    laneSmooth: LANE_SMOOTH,
    itemMoveSpeedMultiplier: difficultySettings.itemMoveSpeedMultiplier,
    switchTimerScale: difficultySettings.switchTimerScale,
    waveSpeedBonus: difficultySettings.waveSpeedBonus,
    getLaneX,
    syncScrollObjectZ,
  }
}

function initItemPool() {
  if (!itemPrototype || !itemGroup) return

  itemPool = []

  for (let i = 0; i < ITEM_POOL_SIZE; i++) {
    const item = cloneItemFromPrototype(itemPrototype)
    const hitbox = createHitboxMesh(0xff4444, ITEM_COLLECT_X, ITEM_COLLECT_Z, HITBOX_HEIGHT)
    item.add(hitbox)
    item.userData.hitbox = hitbox
    item.userData.active = false
    item.visible = false
    itemGroup.add(item)
    itemPool.push(item)
  }
}

async function loadItemVrmPrototype(loader) {
  const gltf = await new Promise((resolve, reject) => {
    loader.load('/models/daruma.vrm', resolve, undefined, reject)
  })

  const vrm = gltf.userData.vrm
  VRMUtils.rotateVRM0(vrm)
  itemPrototype = scaleVrmPrototypeToSize(createItemPrototypeFromVrm(vrm.scene), ITEM_SIZE)
}

function spawnDaruma(lane, spawnDistance, pattern) {
  const mesh = acquireItem()
  if (!mesh) return false

  const trackZ = createTrackSpawnZ(worldScrollZ, spawnDistance)
  const darumaCtx = createDarumaContext(0, getMoveSpeed())
  darumaCtx.spawnLane = lane

  mesh.position.y = itemPrototype.position.y
  mesh.rotation.set(0, ITEM_FACING_Y, 0)
  assignDarumaPattern(mesh, pattern, darumaCtx)
  mesh.userData.active = true
  mesh.visible = true

  items.push(mesh)
  registerScrollableObject(scrollableObjects, mesh, trackZ)
  syncScrollObjectZ(mesh, worldScrollZ)
  return true
}

function randomSpawnDistance() {
  return (
    difficultySettings.spawnDistanceMin +
    Math.random() *
      (difficultySettings.spawnDistanceMax - difficultySettings.spawnDistanceMin)
  )
}

function spawnDarumaSingle() {
  if (!itemGroup || !itemPrototype) return

  const lane = Math.floor(Math.random() * LANE_COUNT)
  spawnDaruma(lane, randomSpawnDistance(), pickDarumaPattern(difficultySettings.level))
}

function spawnDarumaLaneTriple() {
  if (!itemGroup || !itemPrototype) return

  const freeCount = itemPool.filter((item) => !item.userData.active).length
  if (freeCount < TRIPLE_COUNT) {
    spawnDarumaSingle()
    return
  }

  const lane = Math.floor(Math.random() * LANE_COUNT)
  const baseDistance = randomSpawnDistance()
  const pattern = pickDarumaPattern(difficultySettings.level)

  for (let i = 0; i < TRIPLE_COUNT; i++) {
    spawnDaruma(lane, baseDistance + i * TRIPLE_Z_SPACING, pattern)
  }
}

function spawnDarumaWave() {
  spawnWaveCount++
  if (spawnWaveCount % difficultySettings.tripleSpawnEvery === 0) {
    spawnDarumaLaneTriple()
  } else {
    spawnDarumaSingle()
  }
}

function removeItem(index) {
  const mesh = items[index]
  releaseItem(mesh)
  items.splice(index, 1)
}

function updateItems(delta) {
  if (
    !characterRoot ||
    !itemGroup ||
    gamePhase.value !== 'playing' ||
    isGameOver.value ||
    isGoalReached.value
  ) {
    return
  }

  itemSpawnTimer += delta
  if (itemSpawnTimer >= difficultySettings.spawnInterval) {
    itemSpawnTimer = 0
    spawnDarumaWave()
  }

  const charX = characterRoot.position.x
  const speed = getMoveSpeed()
  const darumaCtx = createDarumaContext(delta, speed)

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    updateDarumaPattern(item, darumaCtx)

    const dx = Math.abs(item.position.x - charX)
    const dz = Math.abs(item.position.z)

    if (dx < PLAYER_HIT_HALF_X && dz < PLAYER_HIT_HALF_Z) {
      triggerGameOver()
      return
    }

    if (item.position.z < -ITEM_DESPAWN_DISTANCE) {
      removeItem(i)
    }
  }
}

onMounted(async () => {
  gameStore.initGame()

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87CEEB)
  scene.fog = new THREE.Fog(0x87ceeb, 20, 70)

  camera = new THREE.PerspectiveCamera(75, GAME_ASPECT, 0.1, 1000)
  camera.position.set(0, CAMERA_HEIGHT, -2.0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.domElement.id = 'game-canvas'
  canvasRef.value.appendChild(renderer.domElement)
  layoutObserver = new ResizeObserver(updateGameLayout)
  layoutObserver.observe(canvasRef.value)
  window.addEventListener('resize', updateGameLayout)
  await nextTick()
  updateGameLayout()
  requestAnimationFrame(updateGameLayout)

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(0, LIGHT_HEIGHT, -LIGHT_DISTANCE)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  worldGroup = new THREE.Group()
  floorGroup = new THREE.Group()

  const oceanGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE, 1, 1)
  const oceanMaterial = new THREE.MeshStandardMaterial({ color: 0x0066ff })
  floorOcean = new THREE.Mesh(oceanGeometry, oceanMaterial)
  floorOcean.rotation.x = -Math.PI / 2
  floorOcean.receiveShadow = true
  floorGroup.add(floorOcean)

  floorGrid = new THREE.GridHelper(
    FLOOR_SIZE,
    FLOOR_SEGMENTS,
    0x00ff00,
    0x4488ff,
  )
  floorGrid.position.y = 0.01
  floorGroup.add(floorGrid)

  worldGroup.add(floorGroup)

  itemGroup = new THREE.Group()
  worldGroup.add(itemGroup)

  scene.add(worldGroup)

  playerHitbox = createHitboxMesh(
    0x44ff44,
    PLAYER_HIT_HALF_X,
    PLAYER_HIT_HALF_Z,
    PLAYER_HITBOX_HEIGHT,
  )
  scene.add(playerHitbox)

  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))

  try {
    await loadItemVrmPrototype(loader)
    initItemPool()
    console.log('✅ Item VRM (daruma) loaded successfully!')
  } catch (error) {
    console.error('❌ Item VRM load error:', error)
  }

  loader.load(
    '/models/mandora.vrm',
    async (gltf) => {
      const vrm = gltf.userData.vrm

      VRMUtils.rotateVRM0(vrm)
      vrm.scene.scale.setScalar(PLAYER_SCALE)

      characterRoot = new THREE.Group()
      characterRoot.add(vrm.scene)
      scene.add(characterRoot)
      vrmModel = vrm
      cameraReady = false

      try {
        await playMotion(vrm)
        console.log('✅ VRM + FBX motion loaded successfully!')
      } catch (error) {
        console.error('❌ FBX motion load error:', error)
      }
    },
    (progress) => {
      console.log('Loading VRM...', ((progress.loaded / progress.total) * 100).toFixed(1) + '%')
    },
    (error) => {
      console.error('❌ VRM load error:', error)
    },
  )

  function animate() {
    requestAnimationFrame(animate)

    const delta = clock.getDelta()

    if (mixer) {
      mixer.update(delta)
    }

    if (gamePhase.value === 'playing') {
      updateCharacterMovement(delta)
      updateWorldScroll(delta)
    } else if (characterRoot) {
      characterRoot.position.set(0, 0, 0)
      characterRoot.rotation.z = 0
    }

    if (characterRoot) {
      positionLogTimer += delta
      if (positionLogTimer >= 0.5) {
        positionLogTimer = 0
        const { x, y, z } = characterRoot.position
        console.log(
          `Player position: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)} | worldScrollZ=${worldScrollZ.toFixed(2)}`,
        )
      }
    }

    if (vrmModel) {
      vrmModel.update(delta)
    }

    updateTPSCamera(delta)
    updatePlayerLight()
    updateItems(delta)
    updateHitboxDisplay()

    renderer.render(scene, camera)
  }

  animate()

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function startRecording() {
    const canvas = renderer.domElement
    const stream = canvas.captureStream(60)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    mediaRecorder = new MediaRecorder(stream, { mimeType })

    recordedChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: mimeType })
      recordingStatus.value = 'Converting for X...'
      convertProgress.value = 0

      try {
        const mp4Blob = await convertVideoForX(blob, (progress) => {
          convertProgress.value = progress
        })
        downloadBlob(mp4Blob, 'mandora-dance-x.mp4')
        recordingStatus.value = 'Saved X-ready MP4'
        console.log('🎥 X-ready MP4 saved!')
      } catch (error) {
        console.error('❌ ffmpeg conversion error:', error)
        downloadBlob(blob, 'mandora-dance.webm')
        recordingStatus.value = 'Conversion failed (saved WebM)'
      } finally {
        convertProgress.value = 0
      }
    }

    mediaRecorder.start()
    recordingStatus.value = 'Recording...'
    console.log('🎥 Recording started!')
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      recordingStatus.value = 'Processing...'
      console.log('🎥 Recording stopped!')
    }
  }

  window.addEventListener('keydown', (e) => {
    if (gamePhase.value === 'title') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        startGame()
      }
      return
    }

    if (e.key === 'r' || e.key === 'R') {
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        startRecording()
      } else {
        stopRecording()
      }
    }

    if (e.key === ' ' && (isGameOver.value || isGoalReached.value)) {
      e.preventDefault()
      resetGame()
      return
    }

    if (e.key === 'Escape' && (isGameOver.value || isGoalReached.value)) {
      returnToTitle()
      return
    }

    if (e.key === 'h' || e.key === 'H') {
      showHitboxes.value = !showHitboxes.value
      return
    }

    if (isGameOver.value || isGoalReached.value) return

    if (e.key === 'a' || e.key === 'A') {
      changeLane(-1)
    } else if (e.key === 'd' || e.key === 'D') {
      changeLane(1)
    } else if (e.key === 'c' || e.key === 'C') {
      isOverviewCamera.value = !isOverviewCamera.value
    }


  })
})

onUnmounted(() => {
  layoutObserver?.disconnect()
  layoutObserver = null
  window.removeEventListener('resize', updateGameLayout)
})
</script>

<template>
  <div class="app-root">
    <div ref="canvasRef" class="game-container">
      <GameScreenFrame v-if="gamePhase === 'title'" :z-index="50">
        <TitleScreen @start="startGame" />
      </GameScreenFrame>

      <GameScreenFrame v-if="gamePhase === 'playing' && isGoalReached" :z-index="120">
        <GoalClearScreen
          :score="distanceScore"
          :goal="GOAL_DISTANCE"
          @retry="resetGame"
          @title="returnToTitle"
        />
      </GameScreenFrame>

      <GameScreenFrame v-if="gamePhase === 'playing' && isGameOver && !isGoalReached" :z-index="120">
        <GameOverScreen
          :score="distanceScore"
          :goal="GOAL_DISTANCE"
          :reward-milestone="gameOverReward.milestone"
          :reward-message="gameOverReward.message"
          @retry="resetGame"
          @title="returnToTitle"
        />
      </GameScreenFrame>

      <GameScreenFrame
        v-if="gamePhase === 'playing' && !isGameOver && !isGoalReached"
        :z-index="100"
        pass-through
      >
        <div class="hud">
          <div class="hud-panel">
            <div class="hud-distance">
              <span class="hud-distance-value">{{ distanceScore }}</span>
              <span class="hud-distance-unit">/ {{ GOAL_DISTANCE }}m</span>
            </div>
          </div>
        </div>
      </GameScreenFrame>
    </div>
  </div>
</template>

<style scoped>
.app-root {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #111;
}

.game-container {
  position: relative;
  aspect-ratio: 720 / 1280;
  width: min(100%, calc(100dvh * 720 / 1280));
  max-width: 100%;
  max-height: 100dvh;
  height: auto;
  flex-shrink: 0;
  overflow: hidden;
  touch-action: none;
  --game-ui-scale: 1;
}

.game-container :deep(#game-canvas) {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}

.hud {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px;
}

.hud-panel {
  color: white;
  font-family: sans-serif;
  background: rgba(0, 0, 0, 0.45);
  padding: 10px 14px;
  border-radius: 10px;
  line-height: 1;
}

.hud-distance {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.hud-distance-value {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.hud-distance-unit {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

</style>