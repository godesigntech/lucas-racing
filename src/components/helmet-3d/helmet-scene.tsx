"use client"

import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei"
import { Color, type Material, type Mesh, MeshStandardMaterial, type Object3D } from "three"

import type { HelmetFinish } from "@/types/helmet"

import { SceneLoading } from "./scene-loading"

export interface HelmetSceneProps {
  url: string
  /** Multiplies the shell texture: white areas take this colour, black areas stay black. */
  tint?: string
  finish?: HelmetFinish
  /** Slowly spins until the customer drags it. */
  autoRotate?: boolean
}

// Surface settings per finish. The model's own roughness/metal map still adds detail on top.
const finishes: Record<HelmetFinish, { roughness: number; metalness: number; envMapIntensity: number }> = {
  gloss: { roughness: 0.35, metalness: 0, envMapIntensity: 1.1 },
  matte: { roughness: 1, metalness: 0, envMapIntensity: 0.6 },
  chrome: { roughness: 0.12, metalness: 1, envMapIntensity: 1.6 },
}

/** A copy of the model with its own materials, so tinting one viewer never affects another. */
function cloneWithOwnMaterials(scene: Object3D): Object3D {
  const copy = scene.clone(true)
  copy.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const source = mesh.material as Material
    mesh.material = source instanceof MeshStandardMaterial ? source.clone() : new MeshStandardMaterial({ color: "#ffffff" })
  })
  return copy
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

function HelmetModel({ url, tint = "#ffffff", finish = "gloss" }: Required<Omit<HelmetSceneProps, "autoRotate">>) {
  const { scene } = useGLTF(url)
  const root = useMemo(() => cloneWithOwnMaterials(scene), [scene])

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
      <Lightformer form="ring" color="#c6f432" intensity={0.6} position={[0, 0.5, -4]} scale={2} />
    </Environment>
  )
}

function Progress() {
  const { active, progress } = useProgress()
  return active ? <SceneLoading progress={progress} /> : null
}

/** The three.js scene. Load this through <HelmetViewer>, which keeps three.js out of the main bundle. */
export default function HelmetScene({ url, tint = "#ffffff", finish = "gloss", autoRotate = true }: HelmetSceneProps) {
  // Spin until the customer grabs the helmet; only then does the mouse wheel zoom,
  // so scrolling past the viewer still scrolls the page.
  const [grabbed, setGrabbed] = useState(false)

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
              <HelmetModel url={url} tint={tint} finish={finish} />
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
          enableZoom={grabbed}
          autoRotate={autoRotate && !grabbed}
          autoRotateSpeed={0.9}
          onStart={() => setGrabbed(true)}
        />
      </Canvas>
      <Progress />
    </>
  )
}
