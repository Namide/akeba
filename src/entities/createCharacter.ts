import {
  AdditiveBlending,
  BoxGeometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TextureLoader,
} from 'three';
import { quat, vec3 } from 'mathcat';
import { MotionQuality, MotionType, rigidBody, sphere } from 'crashcat';
import { OBJECT_LAYER_MOVING, Physic } from '../physic/Physic';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { retroizeMaterial, retroizeTexture } from '../render/retroize';
import { DEBUG, LIGHT_SCALE_MIN } from '../config';

export async function createCharacter({ physic, shipMesh }: { physic: Physic, shipMesh: Mesh }) {
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
  retroizeTexture(texture)

  // const characterGeometry = new ConeGeometry(characterRadius, characterRadius * 4, 5, 1)
  // characterGeometry.rotateZ(Math.PI / 2)
  // characterGeometry.translate(-1, 0, 0)


  shipMesh.material = new MeshLambertMaterial({
    map: texture,
    color: 0x00FFFF,
    // wireframe: true
  });
  retroizeMaterial(shipMesh.material)
  shipMesh.up.set(0, 1, 0)
  shipMesh.receiveShadow = true;
  shipMesh.castShadow = true;

  // const characterMesh = new Mesh(characterGeometry, new MeshLambertMaterial({
  //   map: texture,
  //   color: 0xffaa00,
  //   opacity: 0.5,
  //   transparent: true
  // }));
  // characterMesh.up.set(0, 1, 0)
  // characterMesh.castShadow = true;
  // retroizeMaterial(characterMesh.material)

  const material = new SpriteMaterial({ map: texture, transparent: true, opacity: 0.5, depthTest: false, blending: AdditiveBlending });

  const lightLeftSprite = new Sprite(material);
  const lightRightSprite = new Sprite(material);
  lightLeftSprite.position.set(1.3, 0, 0.5)
  lightRightSprite.position.set(1.3, 0, -0.5)
  lightLeftSprite.scale.set(LIGHT_SCALE_MIN, LIGHT_SCALE_MIN, LIGHT_SCALE_MIN)
  lightRightSprite.scale.set(LIGHT_SCALE_MIN, LIGHT_SCALE_MIN, LIGHT_SCALE_MIN)
  retroizeMaterial(material)
  shipMesh.add(lightLeftSprite, lightRightSprite)

  // const light = new SpotLight(0xFF0000, 1, 100, Math.PI / 2)
  // light.position.set(-1.5, 0, 0)
  // light.lookAt(0, 0, 10)
  // shipMesh.add(light)

  // if (DEBUG) {
  //   const helper = new SpotLightHelper(light)
  //   shipMesh.add(helper)
  // }

  const characterBodyMesh = new Mesh(new SphereGeometry(characterRadius, 8, 5), new MeshLambertMaterial({
    wireframe: true,
    color: 0xFF0077
  }));
  retroizeMaterial(characterBodyMesh.material)


  const characterBaseGeometry = new BoxGeometry(characterRadius * 1.9, characterRadius * 1.9, characterRadius * 1.9)
  const characterBaseMesh = new Mesh(characterBaseGeometry, new MeshLambertMaterial({
    wireframe: true,
    color: 0x0077ff
  }));
  retroizeMaterial(characterBaseMesh.material)

  if (!DEBUG) {
    characterBodyMesh.visible = false
    characterBaseMesh.visible = false
  }

  return {
    characterBody,
    characterMesh: shipMesh,
    characterBodyMesh,
    characterBaseMesh,
    lightLeftSprite,
    lightRightSprite,
  }
}
