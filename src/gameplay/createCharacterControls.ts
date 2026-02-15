import { Vector3 } from "three";
import { createKeyboardInputs } from "../inputs/keyboardControls";
import { Vec3 } from "@perplexdotgg/bounce";
import { createCharacter } from "../entities/createCharacterBall";
import { log } from "../helpers/log";
import { Physic } from "../physic/Physic";
import { physicGroupFlags } from "../physic/physicGroupFlags";
import { createInputs } from "../inputs/inputs";
import { createGamepadInputs } from "../inputs/gamepadControls";

const output = document.body.querySelector('.output')!

const MAX_VELOCITY = 200
const TURN_ABILITY = 2 // 0 = not, 1 = instant
const BRAKE_TURN_ABILITY = 3.5
const REACTIVITY = 500000
const BRAKE_REACTIVITY = 100000
const FLY_HEIGHT = 0

const UP = new Vector3(0, 1, 0)

export function createCharacterControls({ characterBody, characterBodyMesh, characterMesh, characterBaseMesh, physic }: Awaited<ReturnType<typeof createCharacter>> & { physic: Physic }) {
  const inputs = createInputs()
  const { dispose: disposeKeyboard } = createKeyboardInputs(inputs)
  const { tick: tickGamepad } = createGamepadInputs(inputs)

  const playerDirection = new Vector3(-1, 0, 0)
  const groundNormal = new Vector3()
  const physicVelocity = new Vector3(-1, 0, 0)
  const nextPlayerVelocity = playerDirection.clone()

  return {
    tick: ({ deltaS }: { deltaS: number }) => {

      characterBody.clearForces();

      tickGamepad()

      updatePhysicDirection(physicVelocity, characterBody)
      // physicVelocity = physicVelocity.length()

      // Update ground normal
      updateGroundNormal(groundNormal, physic, characterBody)

      // const perpendicularRotation = perpendicular.clone().multiplyScalar(rotation * physicVelocity)

      // nextPlayerVelocity.copy(playerDirection)

      const turn = deltaS * (inputs.brake ? BRAKE_TURN_ABILITY : TURN_ABILITY)

      if (inputs.left) {
        const perpendicular = new Vector3()
          .crossVectors({ x: 0, y: 1, z: 0 }, playerDirection);

        // nextPlayerVelocity.lerp(perpendicular, LEVER_ANGLE)
        playerDirection.lerp(perpendicular, turn)

        // ---
        // force.add(perpendicularRotation);
      } else if (inputs.right) {
        const perpendicular = new Vector3()
          .crossVectors({ x: 0, y: -1, z: 0 }, playerDirection);

        // nextPlayerVelocity.lerp(perpendicular, LEVER_ANGLE)
        playerDirection.lerp(perpendicular, turn)
        // ---
        // force.sub(perpendicularRotation);
      }

      let nextSpeed = physicVelocity.length()
      if (inputs.forward) {
        // nextPlayerVelocity.multiplyScalar(MAX_VELOCITY)
        nextSpeed = MAX_VELOCITY
      } else if (inputs.backward) {
        // nextPlayerVelocity.set(0, 0, 0)
        nextSpeed = 0
        // force.sub(playerDirection.normalize().multiplyScalar(MAX_VELOCITY / 2))
      }

      nextPlayerVelocity.copy(playerDirection).multiplyScalar(nextSpeed)
      const force = new Vector3()
        .subVectors(nextPlayerVelocity, physicVelocity)
        .multiplyScalar(inputs.brake ? BRAKE_REACTIVITY : REACTIVITY)

      characterBody.applyLinearForce(new Vec3(force));

      // Square
      const perpendicularDirectionCamera = new Vector3()
        .crossVectors(UP, playerDirection.normalize());
      characterBaseMesh.position.set(characterBody.position.x, characterBody.position.y, characterBody.position.z);
      characterBaseMesh.lookAt(characterBaseMesh.position.clone().add(perpendicularDirectionCamera));

      // Ship
      const perpendicularDirectionVehicle = new Vector3()
        .crossVectors(groundNormal, playerDirection);
      const oldPosition = characterMesh.position
      const oldLookAt = characterMesh.getWorldDirection(new Vector3())

      // characterMesh.position.lerp(characterBody.position, 0.25)
      characterMesh.position.x += (characterBody.position.x - characterMesh.position.x) * 0.9
      characterMesh.position.y += (characterBody.position.y + FLY_HEIGHT - characterMesh.position.y) * 0.8
      characterMesh.position.z += (characterBody.position.z - characterMesh.position.z) * 0.9

      // characterMesh.position.lerp(characterBody.position, 0.25)
      // characterBody.position.x, characterBody.position.y, characterBody.position.z
      characterMesh.up.lerp(groundNormal, 0.1)
      characterMesh.lookAt(
        characterMesh.position.clone().add(oldLookAt)
          .lerp(
            characterMesh.position.clone().add(perpendicularDirectionVehicle), 0.1
          )

      );

      // Ball
      characterBodyMesh.position.set(characterBody.position.x, characterBody.position.y, characterBody.position.z);
      characterBodyMesh.quaternion.set(characterBody.orientation.x, characterBody.orientation.y, characterBody.orientation.z, characterBody.orientation.w);

      log(
        'physic velocity: ' + JSON.stringify(physicVelocity.toArray().map(n => n.toFixed(2)).join(', ')),
        'mesh: ' + characterMesh.getWorldDirection(new Vector3()).toArray().map(n => n.toFixed(2)).join(', '),
        // 'velocity:' + physicVelocity.toFixed(2),
        'ground normal:' + JSON.stringify(groundNormal.toArray().map(n => n.toFixed(2)).join(', ')),
        'player direction:' + JSON.stringify(playerDirection.toArray().map(n => n.toFixed(2)).join(', ')),
        'player velocity:' + JSON.stringify(nextPlayerVelocity.toArray().map(n => n.toFixed(2)).join(', ')),
        'force:' + JSON.stringify(force.toArray().map(n => n.toFixed(2)).join(', ')),
        'lookAt:' + JSON.stringify(characterMesh.getWorldDirection(new Vector3()).toArray().map(n => n.toFixed(2)).join(', ')),
        'lookAt:' + JSON.stringify(characterMesh.getWorldDirection(new Vector3()).toArray().map(n => n.toFixed(2)).join(', ')),
      )
    },
    dispose: () => {
      disposeKeyboard()
    }
  }
}

function updateGroundNormal(groundNormal: Vector3, physic: Physic, characterBody: Parameters<typeof createCharacterControls>[0]['characterBody']) {
  groundNormal.set(0, 0, 0)
  for (const manifold of physic.world.iterateContactManifolds(characterBody)) {
    const otherBody = manifold.bodyA === characterBody ? manifold.bodyB : manifold.bodyA;
    if (otherBody?.belongsToGroups === physicGroupFlags.Ground) {
      if (otherBody === manifold.bodyB) {
        groundNormal.sub(manifold.worldSpaceNormal)
      } else {
        groundNormal.add(manifold.worldSpaceNormal)
      }
    }
  }
  if (groundNormal.length() < 0.1) {
    groundNormal.copy(UP)
  } else {
    groundNormal.normalize()
  }
}

function updatePhysicDirection(physicVelocity: Vector3, characterBody: Parameters<typeof createCharacterControls>[0]['characterBody']) {
  const { x, y, z } = characterBody.linearVelocity
  physicVelocity.set(x, y, z)
}
