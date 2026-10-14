"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { paintHelmetLook } from "@/lib/helmet-3d/paint"
import { prepareHelmetGeometry, TEX_H, TEX_W } from "@/lib/helmet-3d/uv-mapping"
import { EYE_PORT_RUNS, splitIntoZones } from "@/lib/helmet-3d/zones"
import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

/** Optimised copy of the supplied SK-6 test model (public/models). */
export const HELMET_MODEL_URL = "/models/helmet-sk6.glb"

export type HelmetCameraView = "three-quarter" | "front" | "side" | "rear" | "top"

// The model faces −X once prepared.
const CAMERA: Record<HelmetCameraView, [number, number, number]> = {
  "three-quarter": [-2.9, 1.05, 2.9],
  front: [-4.3, 0.35, 0],
  side: [0, 0.35, 4.3],
  rear: [4.3, 0.5, 0],
  top: [0.01, 4.4, 0],
}

export interface Helmet3DViewerProps {
  look: HelmetLook
  autoRotate?: boolean
  view?: HelmetCameraView
  /** Bumps whenever the parent wants the camera reset to `view`. */
  viewKey?: number
  className?: string
  onReady?: () => void
  onError?: (error: Error) => void
}

interface ZoneMaterials {
  shell: THREE.MeshPhysicalMaterial
  visor: THREE.MeshPhysicalMaterial
  trim: THREE.MeshStandardMaterial
  plastic: THREE.MeshPhysicalMaterial
  interior: THREE.MeshStandardMaterial
  frame: THREE.MeshPhysicalMaterial
}

interface SceneState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  shell: THREE.Mesh | null
  materials: ZoneMaterials | null
  spoiler: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial> | null
  gasket: THREE.MeshStandardMaterial
  colorMap: THREE.CanvasTexture
  materialMap: THREE.CanvasTexture
  flight: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null
}

function blankCanvas() {
  const c = document.createElement("canvas")
  c.width = TEX_W
  c.height = TEX_H
  return c
}

/** A swept lip that sits on the rear crown. The supplied model has no spoiler. */
function spoilerGeometry() {
  const profile = new THREE.Shape()
  profile.moveTo(-0.06, -0.01)
  profile.bezierCurveTo(0.12, 0.0, 0.32, 0.02, 0.5, 0.05)
  profile.lineTo(0.53, 0.12)
  profile.bezierCurveTo(0.36, 0.1, 0.16, 0.08, -0.04, 0.05)
  profile.closePath()
  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: 0.72,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 20,
  })
  geometry.translate(0, 0, -0.36)
  return geometry
}

/** Seats the spoiler on the rear crown, following the shell's slope. */
function placeSpoiler(spoiler: THREE.Mesh, shell: THREE.Mesh) {
  const ray = new THREE.Raycaster(new THREE.Vector3(3, 2.1, 0), new THREE.Vector3(-3, -2.1, 0).normalize())
  const hit = ray.intersectObject(shell, false)[0]
  if (!hit?.face) return
  const normal = hit.face.normal.clone().transformDirection(shell.matrixWorld)
  spoiler.position.copy(hit.point).addScaledVector(normal, -0.015)
  spoiler.rotation.set(0, 0, Math.atan2(normal.y, normal.x) - Math.PI / 2)
}

/** Eye-port rubber: tubes projected onto the model from the front along the visor frame edges. */
function gasketGeometries(shell: THREE.Mesh): THREE.BufferGeometry[] {
  const ray = new THREE.Raycaster()
  const forward = new THREE.Vector3(1, 0, 0)
  return EYE_PORT_RUNS.ys.flatMap((y) => {
    const points: THREE.Vector3[] = []
    for (let step = 0; step <= 48; step++) {
      const z = -EYE_PORT_RUNS.halfWidth + (step / 48) * 2 * EYE_PORT_RUNS.halfWidth
      ray.set(new THREE.Vector3(-3, y, z), forward)
      const hit = ray.intersectObject(shell, false)[0]
      if (!hit?.face) continue
      const normal = hit.face.normal.clone().transformDirection(shell.matrixWorld)
      points.push(hit.point.clone().addScaledVector(normal, 0.01))
    }
    if (points.length < 6) return []
    return [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, "centripetal"), 96, 0.018, 8, false)]
  })
}

/** Live 3D helmet, painted from the same `look` as the illustrations. */
export function Helmet3DViewer({
  look,
  autoRotate = false,
  view = "three-quarter",
  viewKey = 0,
  className,
  onReady,
  onError,
}: Helmet3DViewerProps) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<SceneState | null>(null)
  const [modelReady, setModelReady] = useState(false)
  const callbacks = useRef({ onReady, onError })
  useEffect(() => {
    callbacks.current = { onReady, onError }
  }, [onReady, onError])

  // Build the scene once.
  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      callbacks.current.onError?.(new Error("WebGL is not available in this browser."))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.touchAction = "none"
    element.appendChild(renderer.domElement)

    const world = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    world.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(...CAMERA[view])
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 2.6
    controls.maxDistance = 8
    controls.autoRotateSpeed = 1.4

    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(-3, 5, 4)
    world.add(key, new THREE.HemisphereLight(0xffffff, 0x3a3d3b, 0.45))

    const colorMap = new THREE.CanvasTexture(blankCanvas())
    colorMap.colorSpace = THREE.SRGBColorSpace
    colorMap.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const materialMap = new THREE.CanvasTexture(blankCanvas())

    const state: SceneState = { renderer, camera, controls, shell: null, materials: null, spoiler: null, gasket: new THREE.MeshStandardMaterial({ color: 0x111412, roughness: 0.75 }), colorMap, materialMap, flight: null }
    scene.current = state

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      HELMET_MODEL_URL,
      (gltf) => {
        if (scene.current !== state) return
        let source: THREE.Mesh | undefined
        gltf.scene.traverse((child) => {
          if (!source && (child as THREE.Mesh).isMesh) source = child as THREE.Mesh
        })
        if (!source) {
          callbacks.current.onError?.(new Error("The helmet model has no mesh."))
          return
        }
        const geometry = splitIntoZones(prepareHelmetGeometry(source.geometry))
        // Material order follows HelmetZone: shell, visor, trim, plastic, interior.
        const materials: ZoneMaterials = {
          shell: new THREE.MeshPhysicalMaterial({
            map: colorMap,
            roughnessMap: materialMap,
            metalnessMap: materialMap,
            roughness: 1,
            metalness: 1,
            clearcoat: 1,
            clearcoatRoughness: 0.06,
          }),
          visor: new THREE.MeshPhysicalMaterial({ color: 0x10151c, roughness: 0.04, metalness: 0.35, clearcoat: 1, envMapIntensity: 1.3 }),
          trim: new THREE.MeshStandardMaterial({ color: 0x111412, roughness: 0.8 }),
          plastic: new THREE.MeshPhysicalMaterial({ color: 0x1b1e1c, roughness: 0.35, clearcoat: 0.5 }),
          interior: new THREE.MeshStandardMaterial({ color: 0x161917, roughness: 0.95 }),
          frame: new THREE.MeshPhysicalMaterial({ color: 0x15181a, roughness: 0.3, clearcoat: 0.6 }),
        }
        const shell = new THREE.Mesh(geometry, [
          materials.shell,
          materials.visor,
          materials.trim,
          materials.plastic,
          materials.interior,
          materials.frame,
        ])
        state.materials = materials
        world.add(shell)
        const spoiler = new THREE.Mesh(spoilerGeometry(), new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6 }))
        placeSpoiler(spoiler, shell)
        world.add(spoiler)
        for (const run of gasketGeometries(shell)) world.add(new THREE.Mesh(run, state.gasket))
        state.shell = shell
        state.spoiler = spoiler
        setModelReady(true)
      },
      undefined,
      () => callbacks.current.onError?.(new Error("Could not load the helmet model.")),
    )

    const resize = () => {
      const width = element.clientWidth || 300
      const height = element.clientHeight || 300
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = "100%"
      renderer.domElement.style.height = "100%"
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()

    let frame = 0
    const tick = () => {
      if (state.flight) {
        state.flight.t = Math.min(1, state.flight.t + 0.05)
        const eased = 1 - Math.pow(1 - state.flight.t, 3)
        camera.position.lerpVectors(state.flight.from, state.flight.to, eased)
        if (state.flight.t >= 1) state.flight = null
      }
      controls.update()
      renderer.render(world, camera)
      frame = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      pmrem.dispose()
      colorMap.dispose()
      materialMap.dispose()
      renderer.dispose()
      element.removeChild(renderer.domElement)
      scene.current = null
    }
    // The scene is built once; view changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Repaint whenever the look changes.
  useEffect(() => {
    const state = scene.current
    if (!state || !modelReady) return
    let cancelled = false
    paintHelmetLook(look)
      .then(({ color, material }) => {
        if (cancelled || !state.shell) return
        state.colorMap.image = color
        state.colorMap.needsUpdate = true
        state.materialMap.image = material
        state.materialMap.needsUpdate = true
        const matte = look.finish === "matte"
        if (state.materials) {
          state.materials.shell.clearcoat = matte ? 0 : 1
          state.materials.shell.clearcoatRoughness = matte ? 0.6 : 0.06
          state.materials.trim.color.set(look.trim)
        }
        state.gasket.color.set(look.trim)
        if (state.spoiler) {
          state.spoiler.visible = look.spoiler
          state.spoiler.material.color.set(look.graphic)
        }
        callbacks.current.onReady?.()
      })
      .catch((error: Error) => callbacks.current.onError?.(error))
    return () => {
      cancelled = true
    }
  }, [look, modelReady])

  useEffect(() => {
    if (scene.current) scene.current.controls.autoRotate = autoRotate
  }, [autoRotate])

  // Fly the camera to the requested view.
  useEffect(() => {
    const state = scene.current
    if (!state) return
    state.flight = { from: state.camera.position.clone(), to: new THREE.Vector3(...CAMERA[view]), t: 0 }
  }, [view, viewKey])

  return <div ref={host} className={cn("relative size-full cursor-grab active:cursor-grabbing", className)} />
}
