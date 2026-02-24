import { Mesh, Raycaster, Vector3 } from "three";
import { ContactManifold, RigidBody, rigidBody, sphere } from "crashcat";
import { createKeyboardInputs } from "../inputs/keyboardControls";
import { createCharacter } from "../entities/createCharacter";
import { log } from "../helpers/log";
import { Physic } from "../physic/Physic";
import { createInputs } from "../inputs/inputs";
import { createGamepadInputs } from "../inputs/gamepadControls";
import { Render } from "../render/Render";
import { LIGHT_SCALE_MAX, LIGHT_SCALE_MIN } from "../config";
import { quat, vec3 } from "mathcat";


const MAX_VELOCITY = 250
const TURN_ABILITY = 0.8 // 0 = not, 1 = instant
const BRAKE_TURN_ABILITY = 0.95
const REACTIVITY = 0.5
const BRAKE_REACTIVITY = 0.99
const FLY_HEIGHT = 0.5
const UP = new Vector3(0, 1, 0)

export function createCharacterControls({ characterBody, characterBodyMesh, characterMesh, characterBaseMesh, lightLeftSprite, lightRightSprite, physic, trackMesh }: Awaited<ReturnType<typeof createCharacter>> & { physic: Physic, render: Render, trackMesh: Mesh }) {

  const inputs = createInputs()
  const { dispose: disposeKeyboard } = createKeyboardInputs(inputs)
  const { tick: tickGamepad } = createGamepadInputs(inputs)

  const playerDirection = new Vector3(-1, 0, 0)
  const groundNormal = new Vector3(0, 1, 0)
  const physicVelocity = new Vector3(-1, 0, 0)
  const thrust = playerDirection.clone()

  const INIT_POSITION = [...characterBody.position] as [number, number, number]
  const INIT_QUATERNION = [...characterBody.quaternion] as [number, number, number, number]

  return {

    inputs,

    updateNormal(_a: RigidBody, _b: RigidBody, manifold: ContactManifold) {
      groundNormal.set(...manifold.worldSpaceNormal)
    },

    restart: () => {
      playerDirection.set(-1, 0, 0)
      physicVelocity.set(-1, 0, 0)
      thrust.set(-1, 0, 0)
      rigidBody.setLinearVelocity(physic.world, characterBody, [
        0,
        0,
        0,
      ])
      rigidBody.setTransform(physic.world, characterBody, vec3.fromValues(...INIT_POSITION), quat.fromValues(...INIT_QUATERNION), true)
    },

    tick: ({ deltaS }: { deltaS: number }) => {

      tickGamepad()
      physicVelocity.set(...rigidBody.getVelocityAtPoint([0, 0, 0], characterBody, characterBody.position))
      const groundDistance = getGroundDistance(characterBody, trackMesh)

      const turn = (inputs.cancel ? getAlphaLerp(BRAKE_TURN_ABILITY, deltaS) : getAlphaLerp(TURN_ABILITY, deltaS))

      if (inputs.left) {
        const perpendicular = new Vector3()
          .crossVectors({ x: 0, y: 1, z: 0 }, playerDirection);
        playerDirection.lerp(perpendicular, turn)
      } else if (inputs.right) {
        const perpendicular = new Vector3()
          .crossVectors({ x: 0, y: -1, z: 0 }, playerDirection);
        playerDirection.lerp(perpendicular, turn)
      }

      let nextSpeed = physicVelocity.length()
      if (inputs.action || inputs.forward) {
        nextSpeed = MAX_VELOCITY

        const scale = lightRightSprite.scale.x + (LIGHT_SCALE_MAX - lightRightSprite.scale.x) * getAlphaLerp(0.999, deltaS)
        lightRightSprite.scale.set(scale, scale, scale)
        lightLeftSprite.scale.set(scale, scale, scale)

      } else {

        const scale = lightRightSprite.scale.x + (LIGHT_SCALE_MIN - lightRightSprite.scale.x) * getAlphaLerp(0.9999, deltaS)
        lightRightSprite.scale.set(scale, scale, scale)
        lightLeftSprite.scale.set(scale, scale, scale)

        if (inputs.backward) {
          nextSpeed = 0
        }
      }

      thrust.copy(playerDirection).multiplyScalar(nextSpeed)

      const force = new Vector3()
        .subVectors(thrust, physicVelocity)
        .multiplyScalar(inputs.cancel ? BRAKE_REACTIVITY : REACTIVITY)


      if (physicVelocity.y > 0 && groundDistance > 1) {
        rigidBody.setLinearVelocity(physic.world, characterBody, [
          physicVelocity.x,
          0,
          physicVelocity.z,
        ])
      }
      rigidBody.addImpulse(physic.world, characterBody, force.toArray())


      // Square
      const oldCameraLookAt = characterBaseMesh.getWorldDirection(new Vector3())
      const perpendicularDirectionCamera = new Vector3()
        .crossVectors(UP, playerDirection.normalize());
      characterBaseMesh.position.lerp({ x: characterBody.position[0], y: characterBody.position[1], z: characterBody.position[2] }, getAlphaLerp(0.99999999999999989, deltaS));
      characterBaseMesh.lookAt(
        characterBaseMesh.position.clone().add(oldCameraLookAt)
          .lerp(
            characterBaseMesh.position.clone().add(perpendicularDirectionCamera),
            inputs.cancel ? getAlphaLerp(0.9999, deltaS) : getAlphaLerp(0.999999, deltaS)
          )
      );


      // Ship
      const turnDirection = playerDirection.clone().normalize().sub(physicVelocity.clone().normalize())
      const shipNormal = groundNormal.clone().add(turnDirection)
      const perpendicularDirectionVehicle = new Vector3()
        .crossVectors(shipNormal, playerDirection);
      const oldShipLookAt = characterMesh.getWorldDirection(new Vector3())
      characterMesh.position.x += (characterBody.position[0] - characterMesh.position.x) * getAlphaLerp(0.999999999999999999, deltaS)
      characterMesh.position.y += (characterBody.position[1] + FLY_HEIGHT - characterMesh.position.y) * getAlphaLerp(0.9999999999999, deltaS)
      characterMesh.position.z += (characterBody.position[2] - characterMesh.position.z) * getAlphaLerp(0.999999999999999999, deltaS)


      characterMesh.up.lerp(shipNormal, getAlphaLerp(0.999, deltaS))
      characterMesh.lookAt(
        characterMesh.position.clone().add(oldShipLookAt)
          .lerp(
            characterMesh.position.clone().add(perpendicularDirectionVehicle),
            getAlphaLerp(0.999999, deltaS)
          )
      );

      // Ball
      characterBodyMesh.position.set(...characterBody.position);
      characterBodyMesh.quaternion.set(...characterBody.quaternion);
    },

    dispose: () => {
      disposeKeyboard()
    }
  }
}

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const DOWN = new Vector3(0, -1, 0);
function getGroundDistance(characterBody: Parameters<typeof createCharacterControls>[0]['characterBody'], trackMesh: Mesh) {

  const temp = new Vector3(...characterBody.position)
  let distance = 20

  raycaster.set(temp, DOWN);
  const hits = raycaster.intersectObject(trackMesh, false);

  if (hits.length > 0) {
    distance = Math.max(0, hits[0].distance - (characterBody.shape as sphere.SphereShape).radius)
  }

  return distance
}

// To prevent deltaT variations
function getAlphaLerp(lerpFactorPerSecond: number, deltaS: number) {
  return 1 - Math.pow(1 - lerpFactorPerSecond, deltaS);
}
