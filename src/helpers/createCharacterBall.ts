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

const output = document.body.querySelector('.output')!

export function createCharacterTick({ characterBody, characterBodyMesh, characterMesh }: Awaited<ReturnType<typeof createCharacter>>) {
  const { keyboardInputs, dispose } = createKeyboardInputs()

  return {
    tick: () => {
      const speed = 1000;
      const rotation = 1000;

      const velocityDirection = new Vector3(characterBody.linearVelocity.x, characterBody.linearVelocity.y, characterBody.linearVelocity.z)
      const velocityPower = velocityDirection.length()

      characterBody.clearForces(); // forces persist, clear if needed

      output.innerHTML = `${velocityDirection.x.toFixed(2)}<br>${velocityDirection.y.toFixed(2)}<br>${velocityDirection.z.toFixed(2)}`


      // const quatTemp = new Quaternion(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w)
      // const eulerTemp = new Euler().setFromQuaternion(quatTemp)

      const quadTemp = new Quaternion().setFromEuler(new Euler(velocityDirection.x, velocityDirection.y, velocityDirection.z))
      const worldDirection = new Vector3(0, 0, 0).applyQuaternion(quadTemp);
      // quatTemp.x = 0
      // quatTemp.z = 0

      // characterBody.orientation.set(
      //   quatTemp
      // )

      const perpendicular = new Vector3()
        .crossVectors(new Vector3(0, 1, 0), velocityDirection.normalize());
      const perpendicularRotation = perpendicular.clone().multiplyScalar(rotation * velocityPower)
      if (keyboardInputs.left) {
        worldDirection.add(perpendicularRotation);
      }
      if (keyboardInputs.right) {
        worldDirection.sub(perpendicularRotation);
      }

      if (keyboardInputs.forward) {
        worldDirection.add(velocityDirection.normalize().multiplyScalar(speed))
      }

      if (keyboardInputs.backward) {
        worldDirection.sub(velocityDirection.normalize().multiplyScalar(speed / 2))
      }

      characterBody.applyLinearForce(new Vec3(worldDirection)); // { x: 0, y: 1000, z: 0 }  at center of mass


      characterMesh.position.set(characterBody.position.x, characterBody.position.y, characterBody.position.z);
      characterMesh.lookAt(characterMesh.position.clone().add(perpendicular));

      characterBodyMesh.position.set(characterBody.position.x, characterBody.position.y, characterBody.position.z);
      characterBodyMesh.quaternion.set(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w);
    },
    dispose
  }
}

export async function createCharacter({ physic }: { physic: Physic }) {
  const characterRadius = .4;

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
