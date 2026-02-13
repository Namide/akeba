import { Euler, Quaternion, Vector3 } from "three";
import { createKeyboardInputs } from "./keyboardControls";
import { Vec3 } from "@perplexdotgg/bounce";
import { createCharacter } from "./createCharacterBall";
import { log } from "./log";

const output = document.body.querySelector('.output')!

export function createCharacterControls({ characterBody, characterBodyMesh, characterMesh }: Awaited<ReturnType<typeof createCharacter>>) {
  const { keyboardInputs, dispose } = createKeyboardInputs()

  return {
    tick: () => {
      const speed = 1000000;
      const rotation = 10000;

      const velocityDirection = new Vector3(characterBody.linearVelocity.x, characterBody.linearVelocity.y, characterBody.linearVelocity.z)
      const velocityPower = velocityDirection.length()

      // log('velocity: ' + velocityPower)

      characterBody.clearForces(); // forces persist, clear if needed



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
