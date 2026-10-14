import * as THREE from "three"

// The supplied model is one fused mesh, so its parts are found by position.
// Regions were traced from square-on front and side views of the prepared
// model (2 units long, face towards −X, y up). Tune these if the model changes.

export enum HelmetZone {
  Shell = 0,
  Visor = 1,
  Trim = 2,
  Plastic = 3,
  /** Inside of the shell (liner), seen through the visor and the neck opening. */
  Interior = 4,
  /** Visor frame around the glass (dark plastic; hides spikes in the source mesh). */
  Frame = 5,
}

/**
 * Eye-port rubber runs along the top and bottom edges of the visor frame, in
 * the front view (z from −halfWidth to +halfWidth at height y). They sit on the
 * frame/shell boundary, which also hides the spikes in the source mesh there.
 */
export const EYE_PORT_RUNS = { halfWidth: 0.72, ys: [0.296, -0.336] } as const

/** Centre the interior test measures from (the shell's volumetric middle). */
const INSIDE_CENTRE = new THREE.Vector3(0.05, 0.05, 0)

const VISOR = {
  halfWidth: 0.77,
  top: 0.245,
  bottom: -0.28,
  /** Rear edge of the visor in x, at the top and at the bottom. */
  rearTop: -0.25,
  rearBottom: -0.34,
}

/** Eye-port rubber bands just outside the visor glass. */
const FRAME = { halfWidth: 0.81, top: 0.3, bottom: -0.34 }

const PIVOT = { x: 0, y: 0.195, radius: 0.12, minSide: 0.55 }

/** Bottom edge slopes from the chin (front) up to the rear. */
const RIM = { frontX: -0.9, frontY: -0.88, rearX: 0.95, rearY: -0.56, height: 0.055 }

function visorRear(y: number) {
  const t = (y - VISOR.bottom) / (VISOR.top - VISOR.bottom)
  return VISOR.rearBottom + (VISOR.rearTop - VISOR.rearBottom) * t
}

export function zoneAt(x: number, y: number, z: number): HelmetZone {
  const rimY = RIM.frontY + ((x - RIM.frontX) / (RIM.rearX - RIM.frontX)) * (RIM.rearY - RIM.frontY)
  if (y < rimY + RIM.height) return HelmetZone.Trim

  if (Math.abs(z) > PIVOT.minSide && Math.hypot(x - PIVOT.x, y - PIVOT.y) < PIVOT.radius) return HelmetZone.Plastic

  const inFront = x < visorRear(Math.max(VISOR.bottom, Math.min(VISOR.top, y))) + 0.04
  if (!inFront) return HelmetZone.Shell
  if (Math.abs(z) <= VISOR.halfWidth && y <= VISOR.top && y >= VISOR.bottom) return HelmetZone.Visor
  if (Math.abs(z) <= FRAME.halfWidth && y <= FRAME.top && y >= FRAME.bottom) return HelmetZone.Frame
  return HelmetZone.Shell
}

/**
 * Reorders the triangles by zone and adds one draw group per zone, so each
 * zone can use its own material: [shell, visor, trim, plastic, interior, frame].
 */
export function splitIntoZones(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const index = geometry.index
  if (!index) throw new Error("Helmet geometry must be indexed")
  const position = geometry.attributes.position
  const source = index.array
  // Zone each vertex first, then give each triangle its majority zone: this
  // keeps boundaries steadier than testing triangle centres.
  const vertexZone = new Uint8Array(position.count)
  for (let v = 0; v < position.count; v++) vertexZone[v] = zoneAt(position.getX(v), position.getY(v), position.getZ(v))

  const buckets: number[][] = [[], [], [], [], [], []]
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3()
  const normal = new THREE.Vector3(), centroid = new THREE.Vector3(), edge = new THREE.Vector3()
  for (let i = 0; i < source.length; i += 3) {
    const a = source[i], b = source[i + 1], c = source[i + 2]
    pa.fromBufferAttribute(position, a)
    pb.fromBufferAttribute(position, b)
    pc.fromBufferAttribute(position, c)
    centroid.copy(pa).add(pb).add(pc).divideScalar(3)
    normal.subVectors(pc, pb).cross(edge.subVectors(pa, pb)).normalize()
    // Faces pointing back towards the middle are the liner, not the outside.
    const outward = edge.subVectors(centroid, INSIDE_CENTRE).normalize()
    let zone: HelmetZone
    if (normal.dot(outward) < -0.35) zone = HelmetZone.Interior
    else {
      const za = vertexZone[a], zb = vertexZone[b], zc = vertexZone[c]
      zone = za === zb || za === zc ? za : zb === zc ? zb : zoneAt(centroid.x, centroid.y, centroid.z)
    }
    buckets[zone].push(a, b, c)
  }
  const ordered = new Uint32Array(source.length)
  let offset = 0
  geometry.clearGroups()
  buckets.forEach((bucket, zone) => {
    ordered.set(bucket, offset)
    geometry.addGroup(offset, bucket.length, zone)
    offset += bucket.length
  })
  geometry.setIndex(new THREE.BufferAttribute(ordered, 1))
  return geometry
}
