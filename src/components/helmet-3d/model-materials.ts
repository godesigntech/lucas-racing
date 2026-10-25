import { Box3, type Material, type Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Object3D, Vector3 } from "three"

import { bellParts, type BellPartColours } from "@/lib/helmet-3d/parts"

import type { HelmetFinish } from "@/types/helmet"

import { addFilmProjection, createFilmUniforms } from "./film-projection"

const finishes: Record<HelmetFinish, { roughness: number; metalness: number; envMapIntensity: number }> = {
  gloss: { roughness: 0.35, metalness: 0, envMapIntensity: 1.1 },
  satin: { roughness: 0.6, metalness: 0, envMapIntensity: 0.85 },
  matte: { roughness: 1, metalness: 0, envMapIntensity: 0.6 },
  chrome: { roughness: 0.12, metalness: 1, envMapIntensity: 1.6 },
}

/** Clone materials, retaining the artist's glass, rubber and metal properties. */
export function cloneHelmet(scene: Object3D): Object3D {
  const copy = scene.clone(true)
  const film = createFilmUniforms()
  copy.userData.film = film
  copy.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const clone = (source: Material) => {
      const material = source.clone()
      if (mesh.name === "Shell" && material instanceof MeshStandardMaterial) addFilmProjection(material, film)
      return material
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material)
    if (mesh.name === "Spoiler_HP7_F1_Small") mesh.visible = false
  })
  // The supplied model uses metres; keep the viewer's zoom range and floor consistent.
  const size = new Box3().setFromObject(copy).getSize(new Vector3())
  copy.scale.multiplyScalar(0.8 / Math.max(size.y, 0.001))
  copy.updateMatrixWorld(true)
  const displaySize = new Box3().setFromObject(copy).getSize(new Vector3())
  film.filmScale.value = 2.4 / Math.max(displaySize.x, displaySize.y, displaySize.z, 0.001)
  return copy
}

export function updateHelmetSurface(root: Object3D, tint: string, finish: HelmetFinish, trim: string, spoiler: boolean, accessories?: BellPartColours) {
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    if (mesh.name === "Spoiler_HP7_F1_Small") mesh.visible = spoiler
    const part = bellParts.find((item) => item.mesh === mesh.name)
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue
      if (mesh.name === "Shell") {
        material.color.set(tint)
        Object.assign(material, finishes[finish])
        if (material instanceof MeshPhysicalMaterial) {
          material.clearcoat = finish === "gloss" ? 0.25 : 0
          material.clearcoatRoughness = 0.1
        }
      } else if (part) {
        material.color.set(accessories?.[part.key] ?? part.defaultColour ?? trim)
      }
    }
  })
}

/** Geometry and textures belong to useGLTF's cache; only our material copies are disposed. */
export function disposeHelmetMaterials(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => material.dispose())
  })
}
