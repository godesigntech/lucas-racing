import {
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
 * The stand-in KC7 scan has a fragmented texture layout, so a film can't be laid
 * out with its UVs. Instead the film photo is projected from three sides in world
 * space and blended by the surface direction (triplanar mapping), which wraps it
 * seamlessly around the shell much like a real dip. The scan's baked paint is
 * white on the shell and black on the visor and rubbers, so its brightness decides
 * where the film goes: the dark parts stay as they are.
 */

export interface FilmUniforms {
  filmMap: { value: Texture | null }
  /** 0 = no film, 1 = film fully applied. */
  filmStrength: { value: number }
  /** Film tiles per world unit. */
  filmScale: { value: number }
}

export function createFilmUniforms(): FilmUniforms {
  return { filmMap: { value: null }, filmStrength: { value: 0 }, filmScale: { value: 1 } }
}

const vertexDeclarations = /* glsl */ `
varying vec3 vFilmPosition;
varying vec3 vFilmNormal;
`

const vertexBody = /* glsl */ `
vFilmPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vFilmNormal = normalize(mat3(modelMatrix) * objectNormal);
`

const fragmentDeclarations = /* glsl */ `
uniform sampler2D filmMap;
uniform float filmStrength;
uniform float filmScale;
varying vec3 vFilmPosition;
varying vec3 vFilmNormal;
`

const fragmentBody = /* glsl */ `
if (filmStrength > 0.0) {
  vec3 weights = pow(abs(normalize(vFilmNormal)), vec3(4.0));
  weights /= (weights.x + weights.y + weights.z);
  vec3 p = vFilmPosition * filmScale;
  vec3 film = texture2D(filmMap, p.zy).rgb * weights.x
    + texture2D(filmMap, p.xz).rgb * weights.y
    + texture2D(filmMap, p.xy).rgb * weights.z;
  #ifdef USE_MAP
    // Light (painted shell) areas take the film; dark visor and rubbers keep their colour.
    float shell = smoothstep(0.18, 0.6, dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114)));
  #else
    float shell = 1.0;
  #endif
  diffuseColor.rgb = mix(diffuseColor.rgb, film, filmStrength * shell);
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
  }
  // One compiled program for every helmet material with the projection.
  material.customProgramCacheKey = () => "helmet-film-projection"
  ;(material as Material).needsUpdate = true
}

const loader = new TextureLoader()
const cache = new Map<string, Promise<Texture>>()

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
