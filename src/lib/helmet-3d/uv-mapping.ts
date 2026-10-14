import * as THREE from "three"

// The supplied Tripo model is one mesh with no UVs, so we project spherical
// UVs around its centre. Texture space (2048 × 1024):
//   x: 0 = rear centre, 512 = left side, 1024 = face, 1536 = right side, 2048 = rear
//   y: 0 = crown → 1024 = bottom edge
// The model faces −X, so the face sits at u = 0.5.

export const TEX_W = 2048
export const TEX_H = 1024

/** Vertical offset of the projection centre, in normalised model units. */
const CENTRE_Y = 0.15

/** Where the race number sits on the left side (mirrored on the right), clear of the visor pivot. */
export const NUMBER_SPOT = { u: 0.17, v: 0.5 } as const

/** Centres the geometry, scales it to 2 units long and writes spherical UVs. */
export function prepareHelmetGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = source.index ? source : source.clone()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const centre = box.getCenter(new THREE.Vector3())
  const length = box.max.x - box.min.x || 1
  geometry.translate(-centre.x, -centre.y, -centre.z)
  geometry.scale(2 / length, 2 / length, 2 / length)

  const position = geometry.attributes.position
  const polar = new Float32Array(position.count)
  const uv = new Float32Array(position.count * 2)
  let maxPolar = 0
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i) - CENTRE_Y
    const z = position.getZ(i)
    // Runs rear → left → face → right so text reads correctly on both sides.
    const u = (Math.atan2(-z, x) / (2 * Math.PI) + 1) % 1
    const theta = Math.acos(Math.max(-1, Math.min(1, y / (Math.hypot(x, y, z) || 1)))) / Math.PI
    uv[i * 2] = u
    polar[i] = theta
    if (theta > maxPolar) maxPolar = theta
  }
  for (let i = 0; i < position.count; i++) uv[i * 2 + 1] = 1 - polar[i] / maxPolar

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
