import {
  Color,
  LinearFilter,
  NoColorSpace,
  type Material,
  type MeshStandardMaterial,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from "three"

import { MAX_REGIONS } from "./design-textures"

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
  regionMap: { value: Texture | null }
  regionCount: { value: number }
  regionColour: { value: Color[] }
  regionFilm: { value: (Texture | null)[] }
  regionFilmStrength: { value: number[] }
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
    regionMap: { value: null },
    regionCount: { value: 0 },
    regionColour: { value: Array.from({ length: MAX_REGIONS }, () => new Color("#ffffff")) },
    regionFilm: { value: Array.from({ length: MAX_REGIONS }, () => null) },
    regionFilmStrength: { value: Array.from({ length: MAX_REGIONS }, () => 0) },
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
uniform sampler2D regionMap;
uniform int regionCount;
uniform vec3 regionColour[${MAX_REGIONS}];
uniform sampler2D regionFilm[${MAX_REGIONS}];
uniform float regionFilmStrength[${MAX_REGIONS}];
uniform float regionMetalness[${MAX_REGIONS}];
uniform float regionRoughness[${MAX_REGIONS}];
uniform sampler2D decalMap;
uniform float decalStrength;
uniform float decalScale;
uniform vec3 decalCentre;

vec3 sampleHelmetFilm(sampler2D filmTexture) {
  vec3 weights = pow(abs(normalize(vFilmNormal)), vec3(4.0));
  weights /= (weights.x + weights.y + weights.z);
  vec3 p = vFilmPosition * filmScale;
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

/** Written out per region: GLSL can only index sampler arrays with a constant. */
const perRegion = (body: (index: number) => string): string =>
  Array.from({ length: MAX_REGIONS }, (_, index) => `if (regionCount > ${index}) {\n${body(index)}\n}`).join("\n")

const fragmentBody = /* glsl */ `
if (filmStrength > 0.0) {
  vec3 film = sampleHelmetFilm(filmMap);
  #ifdef USE_MAP
    // Light (painted shell) areas take the film; dark visor and rubbers keep their colour.
    float shell = smoothstep(0.18, 0.6, dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114)));
  #else
    float shell = 1.0;
  #endif
  diffuseColor.rgb = mix(diffuseColor.rgb, film, filmStrength * shell);
}
if (templateStrength > 0.0) {
  vec4 regions = texture2D(regionMap, vDesignUv);
  // Later regions paint over earlier ones; the shell is whatever no mask covers.
  ${perRegion(
    (index) => `
    vec3 colour${index} = regionColour[${index}];
    if (regionFilmStrength[${index}] > 0.0) colour${index} = sampleHelmetFilm(regionFilm[${index}]);
    diffuseColor.rgb = mix(diffuseColor.rgb, colour${index}, regions[${index}]);`,
  )}
}
if (decalStrength > 0.0) {
  vec3 dn = normalize(vFilmNormal);
  vec3 dp = (vFilmPosition - decalCentre) * decalScale;
  vec2 flat2 = vec2(0.0);
  vec4 decal = vec4(0.0);

  // Both sides share a quadrant, mirrored, so a name reads correctly left and right.
  flat2 = vec2(sign(dn.x) * dp.z + 0.5, 0.5 - dp.y);
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
  vec4 regions = texture2D(regionMap, vDesignUv);
  ${perRegion((index) => `roughnessFactor = mix(roughnessFactor, regionRoughness[${index}], regions[${index}]);`)}
}
`

const metalnessBody = /* glsl */ `
if (templateStrength > 0.0) {
  vec4 regions = texture2D(regionMap, vDesignUv);
  ${perRegion((index) => `metalnessFactor = mix(metalnessFactor, regionMetalness[${index}], regions[${index}]);`)}
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
  material.customProgramCacheKey = () => "helmet-design-projection-v3"
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

/** Loads a film photo as a tiling texture. Each film is fetched once per page. */
export function loadFilmTexture(url: string): Promise<Texture> {
  let pending = cache.get(url)
  if (!pending) {
    pending = loader.loadAsync(url).then((texture) => {
      texture.colorSpace = SRGBColorSpace
      // The photos don't tile perfectly; mirroring hides the seams.
      texture.wrapS = MirroredRepeatWrapping
      texture.wrapT = MirroredRepeatWrapping
      texture.anisotropy = 8
      return texture
    })
    pending.catch(() => cache.delete(url))
    cache.set(url, pending)
  }
  return pending
}
