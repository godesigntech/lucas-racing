"use client"

import { type RefObject, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei"
import { type Object3D, type Texture } from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

import type { BellPartColours } from "@/lib/helmet-3d/parts"
import type { HelmetTemplateArtwork } from "@/lib/helmet-3d/templates"

import type { HelmetFinish } from "@/types/helmet"

import { type FilmUniforms, loadFilmTexture, loadTemplateMask } from "./film-projection"
import { cloneHelmet, disposeHelmetMaterials, updateHelmetSurface } from "./model-materials"
import { SceneLoading } from "./scene-loading"

export interface HelmetSceneProps {
  url: string
  /** Paint colour of the shell; glass, hardware and lining retain their materials. */
  tint?: string
  finish?: HelmetFinish
  paintFinish?: "gloss" | "satin" | "matte"
  trim?: string
  accessories?: BellPartColours
  spoiler?: boolean
  /** Photo of a hydro-dip film to wrap around the shell, or null for plain paint. */
  film?: string | null
  artwork?: HelmetTemplateArtwork
  graphic?: string
  accent?: string
  graphicFilm?: string
  accentFilm?: string
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

/** Puts a film on the helmet, or takes it off with null. */
function setFilm(root: Object3D, texture: Texture | null) {
  const film = root.userData.film as FilmUniforms
  if (texture) film.filmMap.value = texture
  film.filmStrength.value = texture ? 1 : 0
}

/** Three.js uniforms are imperative state, separate from React's render state. */
function setArtworkEnabled(root: Object3D, enabled: boolean) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.templateStrength.value = enabled ? 1 : 0
}

function setArtworkColours(root: Object3D, graphic: string, accent: string, enabled: boolean, paintFinish: "gloss" | "satin" | "matte") {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.graphicColour.value.set(graphic)
  uniforms.accentColour.value.set(accent)
  uniforms.paintRoughness.value = { gloss: 0.35, satin: 0.6, matte: 1 }[paintFinish]
  if (!enabled) uniforms.templateStrength.value = 0
}

function setArtworkTextures(root: Object3D, graphicMask: Texture, accentMask: Texture, graphicFilm: Texture | null, accentFilm: Texture | null) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.graphicMask.value = graphicMask
  uniforms.accentMask.value = accentMask
  uniforms.graphicFilm.value = graphicFilm
  uniforms.accentFilm.value = accentFilm
  uniforms.graphicFilmStrength.value = graphicFilm ? 1 : 0
  uniforms.accentFilmStrength.value = accentFilm ? 1 : 0
  uniforms.templateStrength.value = 1
}

function HelmetModel({ url, tint = "#ffffff", finish = "gloss", paintFinish = "gloss", film = null, trim = "#171917", spoiler = false, accessories, artwork, graphic = "#111412", accent = "#c6f432", graphicFilm, accentFilm }: Omit<HelmetSceneProps, "autoRotate" | "view">) {
  const { scene } = useGLTF(url)
  const root = useMemo(() => cloneHelmet(scene), [scene])

  useLayoutEffect(() => {
    setArtworkColours(root, graphic, accent, Boolean(artwork), paintFinish)
  }, [root, artwork, graphic, accent, paintFinish])

  // Never show the previous design while a different template's masks load.
  useLayoutEffect(() => {
    setArtworkEnabled(root, false)
  }, [root, artwork])

  useEffect(() => {
    if (!artwork) return
    let cancelled = false
    Promise.all([
      loadTemplateMask(artwork.graphicMask), loadTemplateMask(artwork.accentMask),
      graphicFilm ? loadFilmTexture(graphicFilm) : null,
      accentFilm ? loadFilmTexture(accentFilm) : null,
    ]).then(([graphicMask, accentMask, graphicTexture, accentTexture]) => {
      if (cancelled) return
      setArtworkTextures(root, graphicMask, accentMask, graphicTexture, accentTexture)
    }).catch((error) => console.error("Couldn't load helmet template artwork:", error))
    return () => { cancelled = true }
  }, [root, artwork, graphicFilm, accentFilm])

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
  useLayoutEffect(() => updateHelmetSurface(root, tint, finish, trim, spoiler, accessories), [root, tint, finish, trim, spoiler, accessories])
  useEffect(() => () => disposeHelmetMaterials(root), [root])

  return <primitive object={root} dispose={null} />
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
  paintFinish,
  film = null,
  trim = "#171917",
  accessories,
  artwork,
  graphic,
  accent,
  graphicFilm,
  accentFilm,
  spoiler = false,
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
              <HelmetModel url={url} tint={film ? "#ffffff" : tint} finish={finish} paintFinish={paintFinish} film={film} trim={trim} spoiler={spoiler} accessories={accessories} artwork={artwork} graphic={graphic} accent={accent} graphicFilm={graphicFilm} accentFilm={accentFilm} />
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
