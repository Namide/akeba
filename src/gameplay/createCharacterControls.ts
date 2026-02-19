import { ArrowHelper, BoxGeometry, Mesh, MeshStandardMaterial, Quaternion, Raycaster, Vector3 } from "three";
import { createKeyboardInputs } from "../inputs/keyboardControls";
import { createCharacter } from "../entities/createCharacter";
import { log } from "../helpers/log";
import { OBJECT_LAYER_NOT_MOVING, Physic, worldSettings } from "../physic/Physic";
import { createInputs } from "../inputs/inputs";
import { createGamepadInputs } from "../inputs/gamepadControls";
import { castRay, CastRayStatus, createClosestCastRayCollector, createDefaultCastRaySettings, filter, RigidBody, rigidBody, sphere } from "crashcat";
import { vec3 } from "mathcat";
import { Render } from "../render/Render";
import { LIGHT_SCALE_MAX, LIGHT_SCALE_MIN } from "../config";

// const output = document.body.querySelector('.output')!

const MAX_VELOCITY = 250
const TURN_ABILITY = 2 // 0 = not, 1 = instant
const BRAKE_TURN_ABILITY = 3.5
const REACTIVITY = 0.5
const BRAKE_REACTIVITY = 0.002
const FLY_HEIGHT = 0.5
const RESISTANCE = 0.98
const VELOCITY_DECELERATION = 0.8

const UP = new Vector3(0, 1, 0)
const VECTOR_3 = new Vector3()

export function createCharacterControls({ characterBody, characterBodyMesh, characterMesh, characterBaseMesh, lightLeftSprite, lightRightSprite, physic, render, trackMesh }: Awaited<ReturnType<typeof createCharacter>> & { physic: Physic, render: Render, trackMesh: Mesh }) {
  const inputs = createInputs()
  const { dispose: disposeKeyboard } = createKeyboardInputs(inputs)
  const { tick: tickGamepad } = createGamepadInputs(inputs)

  const playerDirection = new Vector3(-1, 0, 0)
  const groundNormal = new Vector3()
  const shipNormal = new Vector3()
  const physicVelocity = new Vector3(-1, 0, 0)
  const thrust = playerDirection.clone()

  return {
    tick: ({ deltaS }: { deltaS: number }) => {

      // characterBody.clearForces();

      tickGamepad()

      updatePhysicDirection(physicVelocity, characterBody)
      // physicVelocity = physicVelocity.length()

      // Update ground normal
      const groundDistance = updateGroundNormal(groundNormal, physic, characterBody, trackMesh)

      const turn = deltaS * (inputs.brake ? BRAKE_TURN_ABILITY : TURN_ABILITY)

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
      if (inputs.forward) {
        nextSpeed = MAX_VELOCITY

        const scale = lightRightSprite.scale.x + (LIGHT_SCALE_MAX - lightRightSprite.scale.x) * deltaS * 2
        lightRightSprite.scale.set(scale, scale, scale)
        lightLeftSprite.scale.set(scale, scale, scale)
      } else {
        const scale = lightRightSprite.scale.x + (LIGHT_SCALE_MIN - lightRightSprite.scale.x) * deltaS * 10
        lightRightSprite.scale.set(scale, scale, scale)
        lightLeftSprite.scale.set(scale, scale, scale)

        if (inputs.backward) {
          nextSpeed = 0
        }
      }



      thrust.copy(playerDirection).multiplyScalar(nextSpeed)

      const force = new Vector3()
        .subVectors(thrust, physicVelocity)
        .multiplyScalar(inputs.brake ? BRAKE_REACTIVITY : REACTIVITY)


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
      characterBaseMesh.position.lerp({ x: characterBody.position[0], y: characterBody.position[1], z: characterBody.position[2] }, deltaS * 36);
      characterBaseMesh.lookAt(
        characterBaseMesh.position.clone().add(oldCameraLookAt)
          .lerp(
            characterBaseMesh.position.clone().add(perpendicularDirectionCamera),
            inputs.brake ? 7.2 * deltaS : 11.5 * deltaS
          )
      );

      const turnDirection = playerDirection.clone().normalize().sub(physicVelocity.clone().normalize())

      const shipNormal = groundNormal.clone().add(turnDirection)

      // Ship
      const perpendicularDirectionVehicle = new Vector3()
        .crossVectors(shipNormal, playerDirection);
      const oldShipLookAt = characterMesh.getWorldDirection(new Vector3())
      characterMesh.position.x += (characterBody.position[0] - characterMesh.position.x) * 130 * deltaS
      characterMesh.position.y += (characterBody.position[1] + FLY_HEIGHT - characterMesh.position.y) * 50 * deltaS
      characterMesh.position.z += (characterBody.position[2] - characterMesh.position.z) * 130 * deltaS


      characterMesh.up.lerp(shipNormal, 14 * deltaS)
      characterMesh.lookAt(
        characterMesh.position.clone().add(oldShipLookAt)
          .lerp(
            characterMesh.position.clone().add(perpendicularDirectionVehicle)
            , 14 * deltaS
          )
      );

      // Ball
      characterBodyMesh.position.set(...characterBody.position);
      characterBodyMesh.quaternion.set(...characterBody.quaternion);

      log(
        // 'physic velocity: ' + JSON.stringify(physicVelocity.toArray().map(n => n.toFixed(2)).join(', ')),
        // // 'velocity:' + physicVelocity.toFixed(2),
        // 'ground normal:' + JSON.stringify(groundNormal.toArray().map(n => n.toFixed(2)).join(', ')),
        // 'player direction:' + JSON.stringify(playerDirection.toArray().map(n => n.toFixed(2)).join(', ')),
        // 'player velocity:' + JSON.stringify(thrust.toArray().map(n => n.toFixed(2)).join(', ')),
        // 'force:' + JSON.stringify(force.toArray().map(n => n.toFixed(2)).join(', ')),
        // 'lookAt:' + JSON.stringify(characterMesh.getWorldDirection(new Vector3()).toArray().map(n => n.toFixed(2)).join(', ')),
        // 'lookAt:' + JSON.stringify(characterMesh.getWorldDirection(new Vector3()).toArray().map(n => n.toFixed(2)).join(', ')),
        'turnDirection: ' + JSON.stringify(turnDirection.toArray().map(n => n.toFixed(2)).join(', '))
      )
    },
    dispose: () => {
      disposeKeyboard()
    }
  }
}

const raycaster = new Raycaster();
const DOWN = new Vector3(0, -1, 0);
function updateGroundNormal(groundNormal: Vector3, physic: Physic, characterBody: Parameters<typeof createCharacterControls>[0]['characterBody'], trackMesh: Mesh) {

  const temp = new Vector3(...characterBody.position)
  let distance = 20

  raycaster.set(temp, DOWN);
  const hits = raycaster.intersectObject(trackMesh, false);

  if (hits.length > 0) {
    const normal = hits[0].face!.normal.clone()
      .transformDirection(trackMesh.matrixWorld); // local → world space

    groundNormal.lerp(normal, 0.15);
    groundNormal.normalize();
    distance = Math.max(0, hits[0].distance - (characterBody.shape as sphere.SphereShape).radius)
  } else {
    // dans les airs
    groundNormal.lerp(UP, 0.05);
    groundNormal.normalize();
  }

  return distance

  // ---

  // let meshes = []

  // const index = characterBody.index
  // const tempVec3 = new Vector3()

  // VECTOR_3.set(0, 0, 0)
  // for (const contact of physic.world.contacts.contacts) {

  //   if (contact.bodyIndexA === index || contact.bodyIndexB === index) {
  //     const [point] = contact.contactPoints
  //     tempVec3.set(...characterBody.position).sub({ x: point.position1[0], y: point.position1[1], z: point.position1[2] })
  //     VECTOR_3.add(tempVec3)
  //   }

  // }

  // if (VECTOR_3.length() < 0.001) {
  //   VECTOR_3.copy(UP)
  // } else {
  //   VECTOR_3.normalize()

  //   const mesh = new ArrowHelper(VECTOR_3, new Vector3(...characterBody.position), 2, 0xFFFFFF * Math.random())


  //   meshes.push(mesh)
  // }

  // groundNormal.lerp(VECTOR_3, 0.15)
  // groundNormal.normalize()

  // return meshes
}

function updatePhysicDirection(physicVelocity: Vector3, characterBody: Parameters<typeof createCharacterControls>[0]['characterBody']) {
  const [x, y, z] = rigidBody.getVelocityAtPoint([0, 0, 0], characterBody, characterBody.position) // characterBody.linearVelocity
  physicVelocity.set(x, y, z)
}
