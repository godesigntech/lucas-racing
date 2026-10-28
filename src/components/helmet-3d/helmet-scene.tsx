"use client"

import { type RefObject, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei"
import { type Object3D, type Texture } from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

import { Box3, Vector3, type CanvasTexture } from "three"

import type { BellPartColours } from "@/lib/helmet-3d/parts"

import type { HelmetFinish } from "@/types/helmet"

import { buildDecalAtlas, buildRegionMap, MAX_REGIONS, type DecalInput } from "./design-textures"
import { type FilmUniforms, loadFilmTexture } from "./film-projection"
import { cloneHelmet, disposeHelmetMaterials, updateHelmetSurface, updateVisor, type VisorSettings } from "./model-materials"
import { SceneLoading } from "./scene-loading"

/** One editable area of the template, as the preview needs it. */
export interface SceneRegion {
  key: string
  /** Greyscale mask in the model's UVs. The shell is whatever no mask covers. */
  maskUrl: string | null
  colour: string
  /** Hydro-dip film photo, projected over the colour. */
  filmUrl?: string | null
  metalness: number
  roughness: number
}

export interface SceneDesign {
  /** Non-shell regions, in paint order. Only the first four reach the shader. */
  regions: SceneRegion[]
  decals: DecalInput
}

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
  /** The template's editable regions plus the customer's names, numbers and logos. */
  design?: SceneDesign | null
  /** Tint and finish of the visor, or null to leave the model's own material alone. */
  visor?: VisorSettings | null
  /** Mesh of the chosen aero kit; null for the standard shell. */
  aeroMesh?: string | null
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

/** Colours and materials change on every click, so they're set without reloading masks. */
function setRegionAppearance(root: Object3D, regions: SceneRegion[], paintFinish: "gloss" | "satin" | "matte") {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.paintRoughness.value = { gloss: 0.35, satin: 0.6, matte: 1 }[paintFinish]
  regions.slice(0, MAX_REGIONS).forEach((region, index) => {
    uniforms.regionColour.value[index].set(region.colour)
    uniforms.regionMetalness.value[index] = region.metalness
    uniforms.regionRoughness.value[index] = region.roughness
  })
}

/**
 * Where the decal atlas is projected from. The helmet is measured in world space after
 * the scene has been centred, so names and logos sit on the shell whatever the model's
 * own scale and origin happen to be.
 */
function setDecalProjection(root: Object3D) {
  const uniforms = root.userData.film as FilmUniforms
  root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(root)
  const size = box.getSize(new Vector3())
  box.getCenter(uniforms.decalCentre.value)
  uniforms.decalScale.value = 1 / Math.max(size.x, size.y, size.z, 0.001)
}

/** Names, numbers and logos on the shell, or null to take them off. */
function setDecals(root: Object3D, texture: CanvasTexture | null) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.decalMap.value = texture
  uniforms.decalStrength.value = texture ? 1 : 0
  if (texture) setDecalProjection(root)
}

/** The template's masks and films, once they've loaded. */
function setRegionTextures(root: Object3D, regionMap: CanvasTexture, films: (Texture | null)[], count: number) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.regionMap.value = regionMap
  uniforms.regionCount.value = count
  films.forEach((texture, index) => {
    uniforms.regionFilm.value[index] = texture
    uniforms.regionFilmStrength.value[index] = texture ? 1 : 0
  })
  uniforms.templateStrength.value = 1
}

function HelmetModel({ url, tint = "#ffffff", finish = "gloss", paintFinish = "gloss", film = null, trim = "#171917", spoiler = false, accessories, design = null, visor = null, aeroMesh }: Omit<HelmetSceneProps, "autoRotate" | "view">) {
  const { scene } = useGLTF(url)
  const root = useMemo(() => cloneHelmet(scene), [scene])

  const regions = useMemo(() => design?.regions.slice(0, MAX_REGIONS) ?? [], [design])
  // Masks only change with the template; colours change on every click.
  const maskKey = regions.map((region) => region.maskUrl ?? "").join("|")
  const filmKey = regions.map((region) => region.filmUrl ?? "").join("|")

  useLayoutEffect(() => {
    setRegionAppearance(root, regions, paintFinish)
  }, [root, regions, paintFinish])

  // Never show the previous design while a different template's masks load.
  useLayoutEffect(() => {
    setArtworkEnabled(root, false)
  }, [root, maskKey])

  useEffect(() => {
    if (regions.length === 0) return
    let cancelled = false
    Promise.all([
      buildRegionMap(regions.map((region) => region.maskUrl)),
      ...regions.map((region) => (region.filmUrl ? loadFilmTexture(region.filmUrl) : Promise.resolve(null))),
    ])
      .then(([regionMap, ...films]) => {
        if (cancelled || !regionMap) return
        setRegionTextures(root, regionMap, films, regions.length)
      })
      .catch((error) => console.error("Couldn't load helmet template artwork:", error))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the mask and film URLs, not the array identity
  }, [root, maskKey, filmKey, regions.length])

  // Names, numbers and logos, drawn into one atlas and projected onto the shell.
  useEffect(() => {
    if (!design) {
      setDecals(root, null)
      return
    }
    let cancelled = false
    buildDecalAtlas(design.decals)
      .then((texture) => {
        if (!cancelled) setDecals(root, texture)
      })
      .catch((error) => console.error("Couldn't draw the helmet personalisation:", error))
    return () => {
      cancelled = true
    }
  }, [root, design])

  useLayoutEffect(() => updateVisor(root, visor), [root, visor])

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
  useLayoutEffect(
    () => updateHelmetSurface(root, tint, finish, trim, spoiler, accessories, aeroMesh),
    [root, tint, finish, trim, spoiler, accessories, aeroMesh],
  )
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
  design = null,
  visor = null,
  aeroMesh,
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
              <HelmetModel url={url} tint={film ? "#ffffff" : tint} finish={finish} paintFinish={paintFinish} film={film} trim={trim} spoiler={spoiler} accessories={accessories} design={design} visor={visor} aeroMesh={aeroMesh} />
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
