import {
  BoxGeometry,
  Mesh,
  MeshLambertMaterial,
  RepeatWrapping,
  TextureLoader,
} from 'three';
import { OBJECT_LAYER_NOT_MOVING, Physic } from '../physic/Physic';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { box, MotionType, rigidBody } from 'crashcat';
import { vec3 } from 'mathcat';
import { retroizeMaterial, retroizeTexture } from '../render/retroize';

const PLANE_GROUND = false


// we will call this function once the gltf is loaded, since we load suzanne (the monkey) from the gltf
export async function createEntities({ physic }: { physic: Physic }) {
  const meshes: Mesh[] = []

  if (PLANE_GROUND) {
    // create the ground
    const GROUND_SIZE = 1000
    const groundShape = box.create({ halfExtents: [GROUND_SIZE / 2, 1 / 2, GROUND_SIZE / 2] });
    const groundBody = rigidBody.create(physic.world, {
      shape: groundShape,
      objectLayer: OBJECT_LAYER_NOT_MOVING,
      motionType: MotionType.STATIC,
      position: vec3.fromValues(0, -0.5, 0),
      restitution: 0.4,
      friction: 0.95,
    });


    const textureLoader = new TextureLoader()
    const texture = await textureLoader.loadAsync(imgSrc)
    // texture.matrix.makeScale(0.0001, 0.0001)
    // texture.matrix.setUvTransform(0, 0, 0.001, 0.001, 0, 0, 0)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(GROUND_SIZE / 100, GROUND_SIZE / 100)
    retroizeTexture(texture)
    // texture.updateMatrix()
    const groundMesh = new Mesh(new BoxGeometry(GROUND_SIZE, 1, GROUND_SIZE), new MeshLambertMaterial({ map: texture, color: 0xddff99 }));
    retroizeMaterial(groundMesh.material)
    groundMesh.position.set(0, -0.5, 0);
    groundMesh.receiveShadow = true;

    groundMesh.position.set(...groundBody.position);
    groundMesh.quaternion.set(...groundBody.quaternion);

    meshes.push(groundMesh)
  }


  return {
    meshes,
    tick: () => {
      // for dynamic physic elements
    }
  }
}
