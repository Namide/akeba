import { Material, NearestFilter, Texture } from "three";
import { RESOLUTION_HEIGHT } from "../config";

export function retroizeTexture(texture: Texture) {
  texture.anisotropy = 0
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
}

export function retroizeMaterial(material: Material) {

  const PIXEL_SNAPING = RESOLUTION_HEIGHT / 2

  material.onBeforeCompile = (shader) => {
    console.log(shader.vertexShader)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;

vec2 namideResolution = vec2(${PIXEL_SNAPING.toFixed(1)}, ${PIXEL_SNAPING.toFixed(1)});
vec4 namidePos = projectionMatrix * mvPosition;
  
namidePos.xyz /= namidePos.w;
namidePos.xy = floor(namideResolution * namidePos.xy) / namideResolution;
namidePos.xyz *= namidePos.w;

gl_Position = namidePos;
    `
    );
  };
}