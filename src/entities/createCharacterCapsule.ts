import { Vec3 } from '@perplexdotgg/bounce';
import {
  CapsuleGeometry,
  Euler,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { createKeyboardInputs } from '../inputs/keyboardControls';

export function createCharacterTick({ characterBody, characterMesh }: Awaited<ReturnType<typeof createCharacter>>) {
  const { keyboardInputs, dispose } = createKeyboardInputs()

  return {
    tick: (/* options: Parameters<typeof attachTick>[0] | undefined */) => {
      const speed = 10000;
      const rotation = 2500;

      characterBody.clearForces(); // forces persist, clear if needed

      const quatTemp = new Quaternion(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w)
      const eulerTemp = new Euler().setFromQuaternion(quatTemp)

      quatTemp.setFromEuler(eulerTemp)
      quatTemp.x = 0
      quatTemp.z = 0

      characterBody.orientation.set(
        quatTemp
      )

      if (keyboardInputs.left || keyboardInputs.right) {
        const localDirection = new Vector3(
          0,
          keyboardInputs.left ? 1 : -1,
          0,
        )
        const worldDirection = localDirection.clone().applyQuaternion(new Quaternion(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w));
        const angularForce = new Vec3(worldDirection).scale(rotation)
        characterBody.applyAngularForce(angularForce); // { x: 0, y: 1000, z: 0 }  at center of mass
      }

      if (keyboardInputs.forward || keyboardInputs.backward) {
        const localDirection = new Vector3(0, 0, keyboardInputs.forward ? 1 : -1)
        const worldDirection = localDirection.clone().applyQuaternion(new Quaternion(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w));
        const linearForce = new Vec3(worldDirection).scale(speed)
        characterBody.applyLinearForce(linearForce); // { x: 0, y: 1000, z: 0 }  at center of mass
      }

      characterMesh.position.set(characterBody.position.x, characterBody.position.y, characterBody.position.z);
      characterMesh.quaternion.set(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w);
    },
    dispose
  }
}

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
