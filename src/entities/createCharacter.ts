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
import imgLightSrc from '../assets/rear-light.webp'
import { retroizeMaterial, retroizeTexture } from '../render/retroize';
import { DEBUG, LIGHT_SCALE_MIN } from '../config';

export async function createCharacter({ physic, shipMesh }: { physic: Physic, shipMesh: Mesh }) {
  const characterRadius = 1.1;

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


  retroizeMaterial(shipMesh.material as MeshLambertMaterial)
  shipMesh.up.set(0, 1, 0)
  shipMesh.receiveShadow = true;
  shipMesh.castShadow = true;


  const textureLoader = new TextureLoader()
  const lightTexture = await textureLoader.loadAsync(imgLightSrc)
  retroizeTexture(lightTexture)

  const material = new SpriteMaterial({ map: lightTexture, transparent: true, opacity: 0.5, depthTest: false, blending: AdditiveBlending });

  const lightLeftSprite = new Sprite(material);
  const lightRightSprite = new Sprite(material);
  lightLeftSprite.position.set(1.3, 0, 0.5)
  lightRightSprite.position.set(1.3, 0, -0.5)
  lightLeftSprite.scale.set(LIGHT_SCALE_MIN, LIGHT_SCALE_MIN, LIGHT_SCALE_MIN)
  lightRightSprite.scale.set(LIGHT_SCALE_MIN, LIGHT_SCALE_MIN, LIGHT_SCALE_MIN)
  retroizeMaterial(material as SpriteMaterial)
  shipMesh.add(lightLeftSprite, lightRightSprite)


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
