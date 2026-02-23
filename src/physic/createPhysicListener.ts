import { Listener, RigidBody } from "crashcat";

export function createPhysicListener(characterBody: RigidBody, outBodies: RigidBody[], { onOut }: { onOut: () => void }): Listener {
  return {
    onContactAdded: (bodyA, bodyB, manifold, settings) => {
      if (
        (bodyA === characterBody && outBodies.indexOf(bodyB) > -1) ||
        (bodyB === characterBody && outBodies.indexOf(bodyA) > -1
        )
      ) {
        onOut()
      }
    },
    onContactPersisted: (bodyA, bodyB, manifold, settings) => {

    },
    onContactRemoved: (bodyIdA, bodyIdB, subShapeIdA, subShapeIdB) => {
    },
  }
}
