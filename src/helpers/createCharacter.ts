import { Body, Box, CoefficientFunctionType } from '@perplexdotgg/bounce';
import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadSuzanne } from './loadSuzanne';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'

export async function createCharacter({ physic }: { physic: Physic }) {
  const characterRadius = .4;
  const characterHeight = .9;

  // create the character
  const subShape = physic.world.createCapsule({
    radius: characterRadius,
    height: characterHeight,

  })

  const shape = physic.world.createCompoundShape([
    {
      shape: subShape,
      transform: {
        position: [0, 0, 0],
        rotation: [Math.PI / 2, 0, 0]
      }
    },
  ]);

  const characterBody = physic.world.createDynamicBody({
    shape,
    position: [2, 5, 2],
    orientation: [0, Math.PI, 0],
    // belongsToGroups: NoneFlag,
    // collidesWithGroups: NoneFlag,



  });
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)
  const characterMesh = new Mesh(new CapsuleGeometry(characterRadius, characterHeight, 8, 32), new MeshLambertMaterial({
    map: texture,
    color: 0xffaa00
  }));
  characterMesh.castShadow = true;
  characterMesh.geometry.rotateX(Math.PI / 2)


  return {
    characterBody,
    characterMesh
  }
}

export async function createCharacterCapsule({ physic }: { physic: Physic }) {
  const characterRadius = .4;
  const characterHeight = .9;

  // create the character
  const shape = physic.world.createCapsule({
    radius: characterRadius,
    height: characterHeight,

  })
  const characterBody = physic.world.createDynamicBody({
    shape,
    position: [2, 5, 2],
    orientation: [Math.PI / 2, 0, 0],
    // belongsToGroups: NoneFlag,
    // collidesWithGroups: NoneFlag,



  });
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)
  const characterMesh = new Mesh(new CapsuleGeometry(characterRadius, characterHeight, 8, 32), new MeshLambertMaterial({
    map: texture,
    color: 0xffaa00
  }));
  characterMesh.castShadow = true;

  return {
    characterBody,
    characterMesh
  }
}