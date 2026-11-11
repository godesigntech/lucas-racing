import {
  Color,
  LinearFilter,
  NoColorSpace,
  type Material,
  type MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from "three"

import { MAX_REGION_FILMS, MAX_REGIONS } from "./design-textures"

/**
 * The customer's design on the 3D helmet.
 *
 * Three things are layered onto the shell material:
 *
 *  - a whole-shell hydro-dip film, projected from three sides in world space and blended
 *    by surface direction, so the pattern keeps its real-world scale (triplanar mapping);
 *  - the template's editable regions, read from one RGBA mask texture in the model's own
 *    UVs — one region per channel, so a template can have a shell plus up to four areas,
 *    each with its own colour or film, and its own metalness and roughness;
 *  - names, numbers and logos, projected flat from four directions out of a single atlas,
 *    which needs no knowledge of the model's UV layout.
 *
 * Only the shell material gets this shader; glass, rubber and hardware are untouched.
 */

export interface FilmUniforms {
  templateStrength: { value: number }
  paintRoughness: { value: number }
  /** Region coverage packed one per channel: red is region 1, green region 2, and so on. */
  /** Full-colour artwork in the model's UVs, for templates drawn by the designer. */
  artworkMap: { value: Texture | null }
  artworkStrength: { value: number }
  /** 0 while a region still shows the artwork as designed, 1 once the customer has changed it. */
  regionActive: { value: number[] }
  regionMap: { value: Texture | null }
  /** Regions four to six, when a template has that many. */
  regionMap2: { value: Texture | null }
  regionCount: { value: number }
  regionColour: { value: Color[] }
  /** The films in use, shared by every region that has one. */
  regionFilm: { value: (Texture | null)[] }
  /** Which film each region takes, or -1 for paint. */
  regionFilmSlot: { value: number[] }
  /** Per film slot: 1 for a film, smaller for a customer's own print so it shows large, not tiled. */
  regionFilmScale: { value: number[] }
  regionMetalness: { value: number[] }
  regionRoughness: { value: number[] }
  filmMap: { value: Texture | null }
  /** 0 = no film, 1 = film fully applied. */
  filmStrength: { value: number }
  /** Film tiles per world unit. */
  filmScale: { value: number }
  decalMap: { value: Texture | null }
  decalStrength: { value: number }
  /** Maps world position into the decal atlas: 1 / helmet size, and its centre. */
  decalScale: { value: number }
  decalCentre: { value: Vector3 }
}

export function createFilmUniforms(): FilmUniforms {
  return {
    filmMap: { value: null },
    filmStrength: { value: 0 },
    filmScale: { value: 1 },
    templateStrength: { value: 0 },
    paintRoughness: { value: 0.35 },
    artworkMap: { value: null },
    artworkStrength: { value: 0 },
    regionActive: { value: Array.from({ length: MAX_REGIONS }, () => 1) },
    regionMap: { value: null },
    regionMap2: { value: null },
    regionCount: { value: 0 },
    regionColour: { value: Array.from({ length: MAX_REGIONS }, () => new Color("#ffffff")) },
    regionFilm: { value: Array.from({ length: MAX_REGION_FILMS }, () => null) },
    regionFilmSlot: { value: Array.from({ length: MAX_REGIONS }, () => -1) },
    regionFilmScale: { value: Array.from({ length: MAX_REGION_FILMS }, () => 1) },
    regionMetalness: { value: Array.from({ length: MAX_REGIONS }, () => 0) },
    regionRoughness: { value: Array.from({ length: MAX_REGIONS }, () => 0.35) },
    decalMap: { value: null },
    decalStrength: { value: 0 },
    decalScale: { value: 1 },
    decalCentre: { value: new Vector3() },
  }
}

const vertexDeclarations = /* glsl */ `
varying vec3 vFilmPosition;
varying vec3 vFilmNormal;
varying vec2 vDesignUv;
`

const vertexBody = /* glsl */ `
vFilmPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vFilmNormal = normalize(mat3(modelMatrix) * objectNormal);
vDesignUv = uv;
`

const fragmentDeclarations = /* glsl */ `
uniform sampler2D filmMap;
uniform float filmStrength;
uniform float filmScale;
varying vec3 vFilmPosition;
varying vec3 vFilmNormal;
varying vec2 vDesignUv;
uniform float templateStrength;
uniform float paintRoughness;
uniform sampler2D artworkMap;
uniform float artworkStrength;
uniform float regionActive[${MAX_REGIONS}];
uniform sampler2D regionMap;
uniform sampler2D regionMap2;
uniform int regionCount;
uniform vec3 regionColour[${MAX_REGIONS}];
uniform sampler2D regionFilm[${MAX_REGION_FILMS}];
uniform int regionFilmSlot[${MAX_REGIONS}];
uniform float regionFilmScale[${MAX_REGION_FILMS}];
uniform float regionMetalness[${MAX_REGIONS}];
uniform float regionRoughness[${MAX_REGIONS}];
uniform sampler2D decalMap;
uniform float decalStrength;
uniform float decalScale;
uniform vec3 decalCentre;

// Projected from the side, top and front, and blended where the surface turns between them.
// A sharp blend keeps each spot to one projection, so two copies of the film don't overlap.
vec3 sampleHelmetFilm(sampler2D filmTexture, float scale) {
  vec3 weights = pow(abs(normalize(vFilmNormal)), vec3(12.0));
  weights /= (weights.x + weights.y + weights.z);
  vec3 p = vFilmPosition * filmScale * scale;
  return texture2D(filmTexture, p.zy).rgb * weights.x
    + texture2D(filmTexture, p.xz).rgb * weights.y
    + texture2D(filmTexture, p.xy).rgb * weights.z;
}

/**
 * One quadrant of the decal atlas, projected flat along an axis. Anything outside the
 * quadrant is empty rather than clamped, or the edge pixels would smear down the shell.
 */
vec4 sampleDecal(vec2 local, vec2 origin) {
  if (local.x < 0.002 || local.x > 0.998 || local.y < 0.002 || local.y > 0.998) return vec4(0.0);
  return texture2D(decalMap, local * 0.5 + origin);
}
`

/** Both region textures, read once. Regions one to three are in the first, four to six in the second. */
const readRegions = `vec4 regions = texture2D(regionMap, vDesignUv);
  vec4 regions2 = regionCount > 3 ? texture2D(regionMap2, vDesignUv) : vec4(0.0);`
const coverage = (index: number) => (index < 3 ? `regions[${index}]` : `regions2[${index - 3}]`)

/** Written out per region: GLSL can only index sampler arrays with a constant. */
const perRegion = (body: (index: number) => string): string =>
  Array.from({ length: MAX_REGIONS }, (_, index) => `if (regionCount > ${index}) {\n${body(index)}\n}`).join("\n")

const fragmentBody = /* glsl */ `
if (filmStrength > 0.0) {
  vec3 film = sampleHelmetFilm(filmMap, 1.0);
  #ifdef USE_MAP
    // Light (painted shell) areas take the film; dark visor and rubbers keep their colour.
    float shell = smoothstep(0.18, 0.6, dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114)));
  #else
    float shell = 1.0;
  #endif
  // A hydro-dip film is printed on a clear sheet, so the paint underneath tints it.
  diffuseColor.rgb = mix(diffuseColor.rgb, film * diffuseColor.rgb, filmStrength * shell);
}
// Keeps the artwork's highlights and lines in a zone the customer has recoloured.
float artworkShade = 1.0;
if (artworkStrength > 0.0) {
  vec3 artwork = texture2D(artworkMap, vDesignUv).rgb;
  diffuseColor.rgb = artwork;
  artworkShade = clamp(0.72 + 0.4 * max(artwork.r, max(artwork.g, artwork.b)), 0.72, 1.12);
}
if (templateStrength > 0.0) {
  ${readRegions}
  // Later regions paint over earlier ones; the shell is whatever no mask covers.
  ${perRegion(
    (index) => `
    vec3 colour${index} = regionColour[${index}];
    ${Array.from({ length: MAX_REGION_FILMS }, (_, slot) => `if (regionFilmSlot[${index}] == ${slot}) colour${index} = sampleHelmetFilm(regionFilm[${slot}], regionFilmScale[${slot}]) * regionColour[${index}];`).join("\n    ")}
    diffuseColor.rgb = mix(diffuseColor.rgb, colour${index} * artworkShade, ${coverage(index)} * regionActive[${index}]);`,
  )}
}
if (decalStrength > 0.0) {
  vec3 dn = normalize(vFilmNormal);
  vec3 dp = (vFilmPosition - decalCentre) * decalScale;
  vec2 flat2 = vec2(0.0);
  vec4 decal = vec4(0.0);

  // Both sides share a quadrant, mirrored, so a name reads correctly left and right.
  // Seen from +x the camera's right is -z (and from -x it's +z), hence the minus.
  flat2 = vec2(-sign(dn.x) * dp.z + 0.5, 0.5 - dp.y);
  decal = mix(decal, sampleDecal(flat2, vec2(0.0, 0.0)), pow(abs(dn.x), 3.0));

  flat2 = vec2(dp.x + 0.5, 0.5 - dp.y);
  decal = mix(decal, sampleDecal(flat2, vec2(0.5, 0.0)), pow(max(dn.z, 0.0), 3.0));

  flat2 = vec2(0.5 - dp.x, 0.5 - dp.y);
  decal = mix(decal, sampleDecal(flat2, vec2(0.0, 0.5)), pow(max(-dn.z, 0.0), 3.0));

  flat2 = vec2(dp.x + 0.5, dp.z + 0.5);
  decal = mix(decal, sampleDecal(flat2, vec2(0.5, 0.5)), pow(max(dn.y, 0.0), 3.0));

  diffuseColor.rgb = mix(diffuseColor.rgb, decal.rgb, decal.a * decalStrength);
}
`

const roughnessBody = /* glsl */ `
if (templateStrength > 0.0) {
  ${readRegions}
  ${perRegion((index) => `roughnessFactor = mix(roughnessFactor, regionRoughness[${index}], ${coverage(index)} * regionActive[${index}]);`)}
}
`

const metalnessBody = /* glsl */ `
if (templateStrength > 0.0) {
  ${readRegions}
  ${perRegion((index) => `metalnessFactor = mix(metalnessFactor, regionMetalness[${index}], ${coverage(index)} * regionActive[${index}]);`)}
}
`

/** Adds the design projection to a material. Change it later through `uniforms`. */
export function addFilmProjection(material: MeshStandardMaterial, uniforms: FilmUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexDeclarations}`)
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${fragmentDeclarations}`)
      .replace("#include <map_fragment>", `#include <map_fragment>\n${fragmentBody}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${roughnessBody}`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n${metalnessBody}`)
  }
  // One compiled program for every helmet material with the projection.
  material.customProgramCacheKey = () => "helmet-design-projection-v6"
  ;(material as Material).needsUpdate = true
}

const loader = new TextureLoader()
const cache = new Map<string, Promise<Texture>>()
const maskCache = new Map<string, Promise<Texture>>()

/** Masks are linear data, with glTF's UV orientation and no repeated island edges. */
export function loadTemplateMask(url: string): Promise<Texture> {
  let pending = maskCache.get(url)
  if (!pending) {
    pending = loader.loadAsync(url).then((texture) => {
      texture.flipY = false
      texture.colorSpace = NoColorSpace
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture.generateMipmaps = false
      return texture
    })
    pending.catch(() => maskCache.delete(url))
    maskCache.set(url, pending)
  }
  return pending
}

/** A designer's full-colour artwork: a colour image in the model's UVs. */
export function loadArtworkTexture(url: string): Promise<Texture> {
  let pending = maskCache.get(url)
  if (!pending) {
    pending = loader.loadAsync(url).then((texture) => {
      texture.flipY = false
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 8
      return texture
    })
    pending.catch(() => maskCache.delete(url))
    maskCache.set(url, pending)
  }
  return pending
}

/** Loads a film photo as a tiling texture. Each film is fetched once per page. */
export function loadFilmTexture(url: string): Promise<Texture> {
  let pending = cache.get(url)
  if (!pending) {
    pending = loader.loadAsync(url).then((texture) => {
      texture.colorSpace = SRGBColorSpace
      // Repeated the same way round, like a printed dip sheet: mirroring would hide seams but
      // flips the pattern (carbon weave turns into a zigzag, prints appear back to front).
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.anisotropy = 8
      return texture
    })
    pending.catch(() => cache.delete(url))
    cache.set(url, pending)
  }
  return pending
}
