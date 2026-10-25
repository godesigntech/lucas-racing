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
} from "three"

/**
 * Hydro-dip films on the 3D helmet.
 *
 * Projects the film photo from three sides in world space and blends by surface
 * direction (triplanar mapping). Template masks use the model's UVs to keep
 * films and colours within the base, graphic and accent regions.
 * Only the shell material receives this shader; glass and rubber are untouched.
 */

export interface FilmUniforms {
  templateStrength: { value: number }
  paintRoughness: { value: number }
  graphicMask: { value: Texture | null }
  accentMask: { value: Texture | null }
  graphicColour: { value: Color }
  accentColour: { value: Color }
  graphicFilm: { value: Texture | null }
  accentFilm: { value: Texture | null }
  graphicFilmStrength: { value: number }
  accentFilmStrength: { value: number }
  filmMap: { value: Texture | null }
  /** 0 = no film, 1 = film fully applied. */
  filmStrength: { value: number }
  /** Film tiles per world unit. */
  filmScale: { value: number }
}

export function createFilmUniforms(): FilmUniforms {
  return {
    filmMap: { value: null }, filmStrength: { value: 0 }, filmScale: { value: 1 },
    templateStrength: { value: 0 }, paintRoughness: { value: 0.35 }, graphicMask: { value: null }, accentMask: { value: null },
    graphicColour: { value: new Color("#111412") }, accentColour: { value: new Color("#c6f432") },
    graphicFilm: { value: null }, accentFilm: { value: null },
    graphicFilmStrength: { value: 0 }, accentFilmStrength: { value: 0 },
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
uniform sampler2D graphicMask;
uniform sampler2D accentMask;
uniform vec3 graphicColour;
uniform vec3 accentColour;
uniform sampler2D graphicFilm;
uniform sampler2D accentFilm;
uniform float graphicFilmStrength;
uniform float accentFilmStrength;

vec3 sampleHelmetFilm(sampler2D filmTexture) {
  vec3 weights = pow(abs(normalize(vFilmNormal)), vec3(4.0));
  weights /= (weights.x + weights.y + weights.z);
  vec3 p = vFilmPosition * filmScale;
  return texture2D(filmTexture, p.zy).rgb * weights.x
    + texture2D(filmTexture, p.xz).rgb * weights.y
    + texture2D(filmTexture, p.xy).rgb * weights.z;
}
`

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
  float g = texture2D(graphicMask, vDesignUv).r;
  float a = texture2D(accentMask, vDesignUv).r;
  vec3 graphic = graphicColour;
  vec3 accent = accentColour;
  if (graphicFilmStrength > 0.0) graphic = sampleHelmetFilm(graphicFilm);
  if (accentFilmStrength > 0.0) accent = sampleHelmetFilm(accentFilm);
  // Accent > graphic > base; filtered mask edges remain antialiased.
  diffuseColor.rgb = (1.0-a)*(1.0-g)*diffuseColor.rgb + (1.0-a)*g*graphic + a*accent;
}
`

/** Adds the film projection to a material. Change the film later through `uniforms`. */
export function addFilmProjection(material: MeshStandardMaterial, uniforms: FilmUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexDeclarations}`)
      .replace("#include <fog_vertex>", `#include <fog_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${fragmentDeclarations}`)
      .replace("#include <map_fragment>", `#include <map_fragment>\n${fragmentBody}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        if (templateStrength > 0.0 && metalness > 0.5) {
          float baseWeight = (1.0-texture2D(accentMask, vDesignUv).r)*(1.0-texture2D(graphicMask, vDesignUv).r);
          roughnessFactor = mix(paintRoughness, roughnessFactor, baseWeight);
        }
      `)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        if (templateStrength > 0.0) {
          metalnessFactor *= (1.0-texture2D(accentMask, vDesignUv).r)*(1.0-texture2D(graphicMask, vDesignUv).r);
        }
      `)
  }
  // One compiled program for every helmet material with the projection.
  material.customProgramCacheKey = () => "helmet-film-projection-uv-template-v2"
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
