import {
  BoxGeometry,
  ConeGeometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TextureLoader,
} from 'three';
import { quat, vec3 } from 'mathcat';
import { MotionQuality, MotionType, rigidBody, sphere } from 'crashcat';
import { OBJECT_LAYER_MOVING, Physic } from '../physic/Physic';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'

export async function createCharacter({ physic }: { physic: Physic }) {
  const characterRadius = 0.8;

  // create the character
  const shape = sphere.create({
    radius: characterRadius,
  })

  const characterBody = rigidBody.create(physic.world, {
    shape,

    objectLayer: OBJECT_LAYER_MOVING,
    motionType: MotionType.DYNAMIC,
    motionQuality: MotionQuality.DISCRETE,

    position: vec3.fromValues(2, 1, 2),
    quaternion: quat.create(),

    restitution: 0,
    friction: 0.5,
    mass: 50
  });


  // log(`mass: ${characterBody.mass}`, `density: ${characterBody.density}`, `friction: ${characterBody.friction}`)

  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)


  const characterGeometry = new ConeGeometry(characterRadius, characterRadius * 4, 5, 1)
  characterGeometry.rotateZ(Math.PI / 2)
  characterGeometry.translate(-1, 0, 0)

  const characterMesh = new Mesh(characterGeometry, new MeshLambertMaterial({
    map: texture,
    color: 0xffaa00,
    opacity: 0.5,
    transparent: true
  }));

  characterMesh.up.set(0, 1, 0)
  characterMesh.castShadow = true;


  const characterBodyMesh = new Mesh(new SphereGeometry(characterRadius, 8, 5), new MeshLambertMaterial({
    wireframe: true,
    color: 0xFF0077
  }));

  const characterBaseGeometry = new BoxGeometry(characterRadius * 1.9, characterRadius * 1.9, characterRadius * 1.9)
  const characterBaseMesh = new Mesh(characterBaseGeometry, new MeshLambertMaterial({
    wireframe: true,
    color: 0x0077ff
  }));

  return {
    characterBody,
    characterMesh,
    characterBodyMesh,
    characterBaseMesh
  }
}
