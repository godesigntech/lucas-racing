"use client"

import { type RefObject, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei"
import { Box3, Color, type Material, type Mesh, MeshStandardMaterial, type Object3D, type Texture, Vector3 } from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

import type { HelmetFinish } from "@/types/helmet"

import { addFilmProjection, createFilmUniforms, type FilmUniforms, loadFilmTexture } from "./film-projection"
import { SceneLoading } from "./scene-loading"

export interface HelmetSceneProps {
  url: string
  /** Multiplies the shell texture: white areas take this colour, black areas stay black. */
  tint?: string
  finish?: HelmetFinish
  /** Photo of a hydro-dip film to wrap around the shell, or null for plain paint. */
  film?: string | null
  /** Slowly spins until the customer drags it or picks an angle. */
  autoRotate?: boolean
  /** Turns the camera to a preset angle. `at` changes on every request, so picking the same angle again re-centres it. */
  view?: { angle: HelmetAngle; at: number } | null
}

export type HelmetAngle = "angle" | "front" | "side" | "back" | "top"

/** Azimuth (around the helmet) that looks straight at the visor. */
const FRONT = 0

/** Camera direction for each preset angle: azimuth around the helmet and polar angle from straight above. */
const angles: Record<HelmetAngle, { azimuth: number; polar: number }> = {
  angle: { azimuth: FRONT + Math.PI / 4, polar: Math.PI * 0.42 },
  front: { azimuth: FRONT, polar: Math.PI * 0.46 },
  side: { azimuth: FRONT + Math.PI / 2, polar: Math.PI * 0.47 },
  back: { azimuth: FRONT + Math.PI, polar: Math.PI * 0.44 },
  top: { azimuth: FRONT + Math.PI / 6, polar: Math.PI * 0.17 },
}

// Surface settings per finish. The model's own roughness/metal map still adds detail on top.
const finishes: Record<HelmetFinish, { roughness: number; metalness: number; envMapIntensity: number }> = {
  gloss: { roughness: 0.35, metalness: 0, envMapIntensity: 1.1 },
  satin: { roughness: 0.6, metalness: 0, envMapIntensity: 0.85 },
  matte: { roughness: 1, metalness: 0, envMapIntensity: 0.6 },
  chrome: { roughness: 0.12, metalness: 1, envMapIntensity: 1.6 },
}

/** How many film photos fit across the helmet: about the scale of a real dip. */
const FILM_TILES_ACROSS = 2.4

/** A copy of the model with its own materials (so tinting one viewer never affects another), set up for films. */
function cloneWithOwnMaterials(scene: Object3D): Object3D {
  const film = createFilmUniforms()
  const copy = scene.clone(true)
  copy.userData.film = film
  copy.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const source = mesh.material as Material
    const material = source instanceof MeshStandardMaterial ? source.clone() : new MeshStandardMaterial({ color: "#ffffff" })
    addFilmProjection(material, film)
    mesh.material = material
  })
  const size = new Box3().setFromObject(copy).getSize(new Vector3())
  film.filmScale.value = FILM_TILES_ACROSS / Math.max(size.x, size.y, size.z, 0.001)
  return copy
}

/** Puts a film on the helmet, or takes it off with null. */
function setFilm(root: Object3D, texture: Texture | null) {
  const film = root.userData.film as FilmUniforms
  if (texture) film.filmMap.value = texture
  film.filmStrength.value = texture ? 1 : 0
}

function forEachMaterial(root: Object3D, apply: (material: MeshStandardMaterial) => void) {
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && mesh.material instanceof MeshStandardMaterial) apply(mesh.material)
  })
}

function applySurface(material: MeshStandardMaterial, tint: string, finish: HelmetFinish) {
  const surface = finishes[finish]
  material.color = new Color(tint)
  material.roughness = surface.roughness
  material.metalness = surface.metalness
  material.envMapIntensity = surface.envMapIntensity
  material.needsUpdate = true
}

function HelmetModel({ url, tint = "#ffffff", finish = "gloss", film = null }: Required<Omit<HelmetSceneProps, "autoRotate" | "view">>) {
  const { scene } = useGLTF(url)
  const root = useMemo(() => cloneWithOwnMaterials(scene), [scene])

  // Swap films without a loading flash: the current film stays on until the next one has loaded.
  useEffect(() => {
    if (!film) {
      setFilm(root, null)
      return
    }
    let cancelled = false
    loadFilmTexture(film)
      .then((texture) => {
        if (!cancelled) setFilm(root, texture)
      })
      .catch((error) => console.error("Couldn't load the film for the 3D helmet:", error))
    return () => {
      cancelled = true
    }
  }, [film, root])

  // Layout effect: the colour is set before the first frame is drawn, so the helmet never flashes white.
  useLayoutEffect(() => forEachMaterial(root, (material) => applySurface(material, tint, finish)), [root, tint, finish])
  useEffect(() => () => forEachMaterial(root, (material) => material.dispose()), [root])

  return <primitive object={root} />
}

/** Studio lighting built from soft light panels, so no HDR file has to be downloaded. */
function StudioLights() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="ring" color="#f95312" intensity={0.6} position={[0, 0.5, -4]} scale={2} />
    </Environment>
  )
}

function Progress() {
  const { active, progress } = useProgress()
  return active ? <SceneLoading progress={progress} /> : null
}

/** Smallest signed difference between two angles, so the camera turns the short way round. */
function angleBetween(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/** Eases the camera to the requested preset angle. Stops as soon as it arrives or the customer drags. */
function CameraRig({ targetRef }: { targetRef: RefObject<{ azimuth: number; polar: number } | null> }) {
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null

  useFrame((_, delta) => {
    const goal = targetRef.current
    if (!goal || !controls) return
    const azimuth = controls.getAzimuthalAngle()
    const polar = controls.getPolarAngle()
    const turn = angleBetween(azimuth, goal.azimuth)
    const tilt = goal.polar - polar
    const step = 1 - Math.exp(-delta * 7)
    controls.setAzimuthalAngle(azimuth + turn * step)
    controls.setPolarAngle(polar + tilt * step)
    controls.update()
    if (Math.abs(turn) < 0.002 && Math.abs(tilt) < 0.002) targetRef.current = null
  })

  return null
}

/** The three.js scene. Load this through <HelmetViewer>, which keeps three.js out of the main bundle. */
export default function HelmetScene({
  url,
  tint = "#ffffff",
  finish = "gloss",
  film = null,
  autoRotate = true,
  view = null,
}: HelmetSceneProps) {
  // Spin until the customer grabs the helmet; only then does the mouse wheel zoom,
  // so scrolling past the viewer still scrolls the page.
  const [grabbed, setGrabbed] = useState(false)
  const cameraTarget = useRef<{ azimuth: number; polar: number } | null>(null)

  // A picked angle turns the camera there (and, below, stops the spin).
  useEffect(() => {
    if (view) cameraTarget.current = angles[view.angle]
  }, [view])
  const handled = grabbed || Boolean(view)

  return (
    <>
      <Canvas
        camera={{ position: [1.5, 0.55, 1.5], fov: 30, near: 0.05, far: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="touch-none"
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <Suspense fallback={null}>
          <StudioLights />
          <Bounds fit clip observe margin={1.15}>
            <Center>
              <HelmetModel url={url} tint={film ? "#ffffff" : tint} finish={finish} film={film} />
            </Center>
          </Bounds>
          <ContactShadows position={[0, -0.42, 0]} opacity={0.35} scale={3} blur={2.6} far={1} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={0.9}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.62}
          enableZoom={handled}
          autoRotate={autoRotate && !handled}
          autoRotateSpeed={0.9}
          onStart={() => {
            cameraTarget.current = null
            setGrabbed(true)
          }}
        />
        <CameraRig targetRef={cameraTarget} />
      </Canvas>
      <Progress />
    </>
  )
}
