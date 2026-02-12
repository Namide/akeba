import { Vec3 } from '@perplexdotgg/bounce';
import {
  ConeGeometry,
  Euler,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { createKeyboardInputs } from './keyboardControls';

export async function createCharacter({ physic }: { physic: Physic }) {
  const characterRadius = 1;

  // create the character
  const shape = physic.world.createSphere({
    radius: characterRadius,
  })

  const characterBody = physic.world.createDynamicBody({
    shape,
    position: [2, 5, 2],
    orientation: [0, 0, 0],

  });
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)


  const characterGeometry = new ConeGeometry(characterRadius, characterRadius * 4, 5, 1)
  characterGeometry.rotateZ(Math.PI / 2)
  const characterMesh = new Mesh(characterGeometry, new MeshLambertMaterial({
    map: texture,
    color: 0xffaa00
  }));
  characterMesh.castShadow = true;


  const characterBodyMesh = new Mesh(new SphereGeometry(characterRadius, 8, 5), new MeshLambertMaterial({
    wireframe: true,
    color: 0xFF0077
  }));


  return {
    characterBody,
    characterMesh,
    characterBodyMesh
  }
}
