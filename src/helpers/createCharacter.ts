import { Body, Box, CoefficientFunctionType } from '@perplexdotgg/bounce';
import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadSuzanne } from './loadSuzanne';


export function createCharacter({ physic }: { physic: Physic }) {
  const characterRadius = .4;
  const characterHeight = .9;


  // create the character
  const characterBody = physic.world.createDynamicBody({
    shape: physic.world.createCapsule({
      radius: characterRadius,
      height: characterHeight
    }),
    position: [2, 5, 2],
    orientation: [0, 0, 1],
    // belongsToGroups: NoneFlag,
    // collidesWithGroups: NoneFlag,
  });
  const characterMesh = new Mesh(new CapsuleGeometry(characterRadius, characterHeight, 8, 32), new MeshLambertMaterial({ color: 0xffaa00 }));
  characterMesh.castShadow = true;

  return {
    characterBody,
    characterMesh
  }
}