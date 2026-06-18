import * as THREE from 'three'

/**
 * 無限床ワールドスクロール — 概要
 *
 * プレーヤーはシーン原点 (0,0,0) に固定し、走った距離を scrollZ で管理する。
 * ワールド上のオブジェクトは「トラック座標 trackZ」（走行軌道上の絶対 Z）を持ち、
 * 表示位置は毎フレーム `position.z = trackZ - scrollZ` で求める。
 *
 * 床のグリッドは 20m 周期で繰り返す。scrollZ が 10m に達するたびに
 * scrollZ と全オブジェクトの trackZ を 20m 巻き戻し、数値の肥大化を防ぎつつ
 * 見た目は連続したまま無限に走れるようにする。
 *
 * 座標系:
 *   - プレーヤー: 常に (0, 0, 0)
 *   - スクロールオブジェクト: trackZ（論理位置）→ 表示 z = trackZ - scrollZ
 *   - 床グリッド: floorGroup 内で z = -euclideanModulo(scrollZ, WRAP_OFFSET)
 */

export const FLOOR_WRAP_INTERVAL = 10
export const FLOOR_WRAP_OFFSET = 20

export function advanceWorldScroll(scrollZ, delta, speed) {
  return scrollZ + speed * delta
}

export function getScrollPhase(scrollZ, wrapOffset = FLOOR_WRAP_OFFSET) {
  return THREE.MathUtils.euclideanModulo(scrollZ, wrapOffset)
}

export function getFloorScrollOffset(scrollZ, wrapOffset = FLOOR_WRAP_OFFSET) {
  return -getScrollPhase(scrollZ, wrapOffset)
}

export function createTrackSpawnZ(scrollZ, distanceAhead) {
  return scrollZ + distanceAhead
}

export function syncScrollObjectZ(object, scrollZ) {
  object.position.z = object.userData.trackZ - scrollZ
}

/**
 * scrollZ が WRAP_INTERVAL に達したら scrollZ と全 trackZ を WRAP_OFFSET 分巻き戻す。
 * 表示位置 (trackZ - scrollZ) は変わらないため、オブジェクトは視覚的に連続する。
 */
export function wrapWorldScroll(scrollZ, scrollableObjects) {
  let nextScrollZ = scrollZ

  while (nextScrollZ >= FLOOR_WRAP_INTERVAL) {
    nextScrollZ -= FLOOR_WRAP_OFFSET

    for (const object of scrollableObjects) {
      object.userData.trackZ -= FLOOR_WRAP_OFFSET
    }
  }

  return nextScrollZ
}

export function registerScrollableObject(scrollableObjects, object, trackZ) {
  object.userData.trackZ = trackZ
  scrollableObjects.push(object)
}

export function unregisterScrollableObject(scrollableObjects, object) {
  const index = scrollableObjects.indexOf(object)
  if (index >= 0) {
    scrollableObjects.splice(index, 1)
  }
}

export function syncAllScrollObjects(scrollableObjects, scrollZ) {
  for (const object of scrollableObjects) {
    syncScrollObjectZ(object, scrollZ)
  }
}