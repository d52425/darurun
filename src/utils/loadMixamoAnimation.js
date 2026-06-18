import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { mixamoVRMRigMap } from './mixamoVRMRigMap.js'
import { quaterniusVRMRigMap } from './quaterniusVRMRigMap.js'

const humanoidVRMRigMap = { ...mixamoVRMRigMap, ...quaterniusVRMRigMap }

function normalizeSourceBoneName(name) {
  return name.replace(/^mixamorig:/, 'mixamorig')
}

function findHipsBone(asset) {
  return (
    asset.getObjectByName('mixamorigHips') ??
    asset.getObjectByName('mixamorig:Hips') ??
    asset.getObjectByName('Hips')
  )
}

/**
 * Load a Mixamo FBX animation and retarget it for a VRM model.
 *
 * @param {string} url
 * @param {import('@pixiv/three-vrm').VRM} vrm
 * @returns {Promise<THREE.AnimationClip>}
 */
export function loadMixamoAnimation(url, vrm) {
  const loader = new FBXLoader()

  return loader.loadAsync(url).then((asset) => {
    const clip =
      THREE.AnimationClip.findByName(asset.animations, 'mixamo.com') ??
      asset.animations[0]

    if (!clip) {
      throw new Error(`No animation found in ${url}`)
    }

    const tracks = []
    const restRotationInverse = new THREE.Quaternion()
    const parentRestWorldRotation = new THREE.Quaternion()
    const quatA = new THREE.Quaternion()

    const hipsBone = findHipsBone(asset)
    if (!hipsBone) {
      throw new Error(`Hips bone not found in ${url}`)
    }

    const motionHipsHeight = hipsBone.position.y
    const vrmHipsHeight = vrm.humanoid.normalizedRestPose.hips.position[1]
    const hipsPositionScale = vrmHipsHeight / motionHipsHeight
    const isVRM0 = vrm.meta?.metaVersion === '0'

    clip.tracks.forEach((track) => {
      const [sourceRigNameRaw, propertyName] = track.name.split('.')
      const sourceRigName = normalizeSourceBoneName(sourceRigNameRaw)
      const vrmBoneName = humanoidVRMRigMap[sourceRigName]
      const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)
      const mixamoRigNode = asset.getObjectByName(sourceRigName) ?? asset.getObjectByName(sourceRigNameRaw)

      if (!vrmNode || !mixamoRigNode) return

      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert()
      mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation)

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        for (let i = 0; i < track.values.length; i += 4) {
          const flatQuaternion = track.values.slice(i, i + 4)
          quatA.fromArray(flatQuaternion)
          quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse)
          quatA.toArray(flatQuaternion)
          flatQuaternion.forEach((v, index) => {
            track.values[index + i] = v
          })
        }

        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${vrmNode.name}.${propertyName}`,
            track.times,
            track.values.map((v, i) => (isVRM0 && i % 2 === 0 ? -v : v)),
          ),
        )
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        // World movement is handled by the character root; keep only vertical bobbing.
        if (vrmBoneName === 'hips' && propertyName === 'position') {
          const yValues = []
          const yTimes = []
          for (let i = 0; i < track.values.length; i += 3) {
            yValues.push(track.values[i + 1] * hipsPositionScale)
            yTimes.push(track.times[i / 3])
          }
          if (yValues.length > 0) {
            tracks.push(
              new THREE.NumberKeyframeTrack(
                `${vrmNode.name}.position[y]`,
                yTimes,
                yValues,
              ),
            )
          }
          return
        }

        const value = track.values.map(
          (v, i) => (isVRM0 && i % 3 !== 1 ? -v : v) * hipsPositionScale,
        )
        tracks.push(new THREE.VectorKeyframeTrack(`${vrmNode.name}.${propertyName}`, track.times, value))
      }
    })

    return new THREE.AnimationClip(clip.name || 'vrmAnimation', clip.duration, tracks)
  })
}