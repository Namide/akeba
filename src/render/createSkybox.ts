import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { retroizeTexture } from './retroize';
import { EquirectangularReflectionMapping, TextureLoader } from 'three';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'

export async function createSkybox() {

  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)
  retroizeTexture(texture)
  texture.mapping = EquirectangularReflectionMapping

  const height = 1
  const radius = 3000;
  const skybox = new GroundedSkybox(texture, height, radius);
  skybox.position.y = height - 82.5;

  return { skybox }
}