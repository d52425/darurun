import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

export function createItemPrototypeFromVrm(vrmScene) {
  const model = cloneSkeleton(vrmScene)
  const wrapper = new THREE.Group()
  wrapper.add(model)
  return wrapper
}

export function scaleVrmPrototypeToSize(prototype, targetSize) {
  prototype.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(prototype)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 1e-3)
  const scale = targetSize / maxDim

  prototype.scale.setScalar(scale)
  prototype.position.y = -box.min.y * scale + 0.01

  return prototype
}

export function cloneItemFromPrototype(prototype) {
  const item = cloneSkeleton(prototype)
  item.scale.copy(prototype.scale)
  item.position.copy(prototype.position)
  return item
}