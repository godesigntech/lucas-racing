"use client"

import { type RefObject, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei"
import { type Object3D, type Texture } from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

import { BackSide, Box3, Vector3, type CanvasTexture } from "three"

import type { BellPartColours } from "@/lib/helmet-3d/parts"

import type { VisorStrip } from "@/types/configurator"
import type { HelmetFinish } from "@/types/helmet"

import { buildDecalAtlas, buildRegionMap, MAX_REGION_FILMS, MAX_REGIONS, type DecalInput } from "./design-textures"
import { type FilmUniforms, loadArtworkTexture, loadFilmTexture } from "./film-projection"
import { cloneHelmet, disposeHelmetMaterials, type SpoilerFinish, updateHelmetSurface, updateSpoilerFinish, updateVisor, type VisorSettings } from "./model-materials"
import type { HelmetSpot } from "@/lib/helmet-3d/decal-layout"

import { SceneLoading } from "./scene-loading"
import { removeVisorStrips, updateVisorStrip } from "./visor-strip"

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
  /** On a full-colour template, this zone still shows the artwork untouched. */
  asDesigned?: boolean
}

export interface SceneDesign {
  /** A designer's full-colour artwork in the model's UVs, shown under the regions. */
  artworkUrl?: string | null
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
  /** Step 13's printed band across the top of the visor. */
  visorStrip?: VisorStrip | null
  /** Photo of the film on the visor strip, when it's dipped. */
  visorStripFilmUrl?: string | null
  /** How the spoiler is finished; null leaves it clear. */
  spoilerFinish?: SpoilerFinish | null
  /** Mesh of the chosen aero kit; null for the standard shell. */
  aeroMesh?: string | string[] | null
  /** Told which part of the design was tapped: a region key, or "base" for the shell around them. */
  onPickRegion?: (key: string) => void
  /** While true, pressing and dragging on the helmet places an item instead of turning it. */
  placing?: boolean
  /** Told where on the helmet the item is being dragged to. */
  onPlace?: (spot: HelmetSpot) => void
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

/** Where a pointer meets the painted shell, looking past the visor and any hidden parts in front of it. */
function shellHit(event: ThreeEvent<MouseEvent | PointerEvent>) {
  return event.intersections.find((intersection) => intersection.object.name === "Shell")
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

function setArtwork(root: Object3D, texture: Texture | null) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.artworkMap.value = texture
  uniforms.artworkStrength.value = texture ? 1 : 0
}

/** Colours and materials change on every click, so they're set without reloading masks. */
function setRegionAppearance(root: Object3D, regions: SceneRegion[], paintFinish: "gloss" | "satin" | "matte") {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.paintRoughness.value = { gloss: 0.35, satin: 0.6, matte: 1 }[paintFinish]
  regions.slice(0, MAX_REGIONS).forEach((region, index) => {
    uniforms.regionColour.value[index].set(region.colour)
    uniforms.regionMetalness.value[index] = region.metalness
    uniforms.regionRoughness.value[index] = region.roughness
    uniforms.regionActive.value[index] = region.asDesigned ? 0 : 1
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

/** How much larger than a film a customer's print is shown: films tile about six times across the helmet, a print about once. */
const PRINT_SCALE = 0.2

/**
 * The template's masks and films, once they've loaded. Regions using the same film share
 * a slot; past the shader's film limit a region falls back to its colour.
 */
function setRegionTextures(root: Object3D, regionMaps: CanvasTexture[], films: (Texture | null)[], count: number, prints: boolean[] = []) {
  const uniforms = root.userData.film as FilmUniforms
  uniforms.regionMap.value = regionMaps[0]
  uniforms.regionMap2.value = regionMaps[1] ?? null
  uniforms.regionCount.value = count
  const slots: Texture[] = []
  uniforms.regionFilm.value.fill(null)
  uniforms.regionFilmScale.value.fill(1)
  films.forEach((texture, index) => {
    let slot = texture ? slots.indexOf(texture) : -1
    if (texture && slot === -1 && slots.length < MAX_REGION_FILMS) slot = slots.push(texture) - 1
    uniforms.regionFilmSlot.value[index] = slot
    // A customer's own print shows about once per side of the helmet rather than tiled.
    if (slot !== -1 && prints[index]) uniforms.regionFilmScale.value[slot] = PRINT_SCALE
  })
  slots.forEach((texture, slot) => (uniforms.regionFilm.value[slot] = texture))
  uniforms.templateStrength.value = 1
}

function HelmetModel({ url, tint = "#ffffff", finish = "gloss", paintFinish = "gloss", film = null, trim = "#171917", spoiler = false, accessories, design = null, visor = null, visorStrip = null, visorStripFilmUrl = null, spoilerFinish = null, aeroMesh, onPickRegion, placing = false, onPlace }: Omit<HelmetSceneProps, "autoRotate" | "view">) {
  // Read when a drag starts, not during render: the drag turns the orbit controls off for its duration.
  const getThree = useThree((state) => state.get)
  const setOrbit = (enabled: boolean) => {
    const controls = getThree().controls as unknown as OrbitControlsImpl | null
    if (controls) controls.enabled = enabled
  }
  const dragging = useRef(false)
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
      .then(([regionMaps, ...films]) => {
        if (cancelled || !regionMaps) return
        // Films live in /films; anything else is the customer's uploaded print.
        const prints = regions.map((region) => Boolean(region.filmUrl) && !region.filmUrl!.startsWith("/films/"))
        setRegionTextures(root, regionMaps as CanvasTexture[], films as (Texture | null)[], regions.length, prints)
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

  // A designer's full-colour artwork, kept off while the next one loads so two designs never mix.
  const artworkUrl = design?.artworkUrl ?? null
  useEffect(() => {
    setArtwork(root, null)
    if (!artworkUrl) return
    let cancelled = false
    loadArtworkTexture(artworkUrl)
      .then((texture) => {
        if (!cancelled) setArtwork(root, texture)
      })
      .catch((error) => console.error("Couldn't load the template artwork:", error))
    return () => {
      cancelled = true
    }
  }, [root, artworkUrl])

  useLayoutEffect(() => updateVisor(root, visor), [root, visor])

  // The strip is redrawn when its text, colours or font change; the old one stays until the new one is ready.
  const stripKey = visorStrip?.enabled ? JSON.stringify(visorStrip) : ""
  const spoilerKey = spoilerFinish ? JSON.stringify(spoilerFinish) : ""
  useEffect(() => {
    let cancelled = false
    updateVisorStrip(root, stripKey ? (JSON.parse(stripKey) as VisorStrip) : null, visorStripFilmUrl, () => cancelled).catch((error) =>
      console.error("Couldn't draw the visor strip:", error),
    )
    return () => {
      cancelled = true
    }
  }, [root, stripKey, visorStripFilmUrl])

  // The spoiler keeps its current look until a new film has loaded.
  useEffect(() => {
    const finish = spoilerKey ? (JSON.parse(spoilerKey) as SpoilerFinish) : null
    if (!finish?.filmUrl) {
      updateSpoilerFinish(root, finish, null)
      return
    }
    let cancelled = false
    loadFilmTexture(finish.filmUrl)
      .then((texture) => {
        if (!cancelled) updateSpoilerFinish(root, finish, texture)
      })
      .catch((error) => console.error("Couldn't load the spoiler film:", error))
    return () => {
      cancelled = true
    }
  }, [root, spoilerKey])
  useEffect(() => () => removeVisorStrips(root), [root])

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

  // A tap (not a drag) on the shell finds the part of the design under it from the packed masks.
  const pick = (event: ThreeEvent<MouseEvent>) => {
    // The visor and hidden parts can sit in front of the shell, so look for the shell itself.
    const hit = shellHit(event)
    if (!onPickRegion || !design || event.delta > 6 || !hit?.uv) return
    event.stopPropagation()
    const uniforms = root.userData.film as FilmUniforms
    let key = "base"
    if (uniforms.templateStrength.value > 0) {
      // Later regions are painted over earlier ones, so the last one covering this spot wins.
      const maps = [uniforms.regionMap.value, uniforms.regionMap2.value]
      design.regions.slice(0, MAX_REGIONS).forEach((region, index) => {
        const canvas = maps[Math.floor(index / 3)]?.image as HTMLCanvasElement | undefined
        const context = canvas?.getContext?.("2d", { willReadFrequently: true })
        if (!canvas || !context) return
        const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(hit.uv!.x * canvas.width)))
        const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(hit.uv!.y * canvas.height)))
        if (context.getImageData(x, y, 1, 1).data[index % 3] > 127) key = region.key
      })
    }
    onPickRegion(key)
  }

  /** Where on the face of the helmet a pointer is, in the same terms the decal shader uses. */
  const spotFrom = (event: ThreeEvent<PointerEvent>): HelmetSpot | null => {
    const hit = shellHit(event)
    if (!hit?.face) return null
    setDecalProjection(root)
    const uniforms = root.userData.film as FilmUniforms
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    const p = hit.point.clone().sub(uniforms.decalCentre.value).multiplyScalar(uniforms.decalScale.value)
    const side = normal.x > 0 ? "left" : "right"
    if (normal.y > Math.max(Math.abs(normal.x), Math.abs(normal.z))) return { face: "top", x: p.x + 0.5, y: p.z + 0.5, side }
    if (Math.abs(normal.x) > Math.abs(normal.z)) return { face: "sides", x: -Math.sign(normal.x) * p.z + 0.5, y: 0.5 - p.y, side }
    return normal.z > 0 ? { face: "front", x: p.x + 0.5, y: 0.5 - p.y, side } : { face: "back", x: 0.5 - p.x, y: 0.5 - p.y, side }
  }
  const place = (event: ThreeEvent<PointerEvent>, start: boolean) => {
    if (!placing || !onPlace || (!start && !dragging.current)) return
    const spot = spotFrom(event)
    if (!spot) return
    event.stopPropagation()
    if (start) {
      dragging.current = true
      setOrbit(false)
      ;(event.target as Element | null)?.setPointerCapture?.(event.pointerId)
    }
    onPlace(spot)
  }
  const stopPlacing = () => {
    dragging.current = false
    setOrbit(true)
  }

  return (
    <primitive
      object={root}
      dispose={null}
      onClick={pick}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => place(event, true)}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => place(event, false)}
      onPointerUp={stopPlacing}
      onPointerCancel={stopPlacing}
    />
  )
}

/** Studio lighting built from soft light panels, so no HDR file has to be downloaded. */
function StudioLights() {
  return (
    <Environment resolution={256}>
      {/* A soft grey studio all round, like a photographer's cyclorama: chrome and gloss reflect
          their surroundings, and a black void made the back of a chrome helmet look black. */}
      <mesh scale={30}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#5e5e5e" side={BackSide} />
      </mesh>
      <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      {/* Behind and below: chrome mirrors its surroundings, so without these the back of a chrome helmet looks black. */}
      <Lightformer form="rect" intensity={1.6} position={[0, 2, -5]} rotation-y={Math.PI} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[0, 0.5, 5]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} />
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
  visorStrip = null,
  visorStripFilmUrl = null,
  spoilerFinish = null,
  aeroMesh,
  onPickRegion,
  placing,
  onPlace,
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
              <HelmetModel url={url} tint={tint} finish={finish} paintFinish={paintFinish} film={film} trim={trim} spoiler={spoiler} accessories={accessories} design={design} visor={visor} visorStrip={visorStrip} visorStripFilmUrl={visorStripFilmUrl} spoilerFinish={spoilerFinish} aeroMesh={aeroMesh} onPickRegion={onPickRegion} placing={placing} onPlace={onPlace} />
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
