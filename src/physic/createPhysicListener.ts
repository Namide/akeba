import { ContactManifold, ContactSettings, Listener, RigidBody } from "crashcat";

export function createPhysicListener(list: {
  eventName: 'added' | 'persist' | 'removed',
  main: RigidBody,
  other: RigidBody[],
  callback: (bodyA: RigidBody, bodyB: RigidBody, manifold: ContactManifold, settings: ContactSettings) => void
}[]): Listener {
  return {
    onContactAdded: (bodyA, bodyB, manifold, settings) => {
      dispatch(list.filter(({ eventName }) => eventName === 'added'), {
        bodyA, bodyB, manifold, settings
      })
    },
    onContactPersisted: (bodyA, bodyB, manifold, settings) => {
      dispatch(list.filter(({ eventName }) => eventName === 'persist'), {
        bodyA, bodyB, manifold, settings
      })
    },
    onContactRemoved: (/* bodyIdA, bodyIdB, subShapeIdA, subShapeIdB */) => {
      // dispatch(list.filter(({ eventName }) => eventName === 'persist'), {
      //   bodyA, bodyB, manifold, settings
      // })
    },
  }
}

function dispatch(list: {
  main: RigidBody,
  other: RigidBody[],
  callback: (bodyA: RigidBody, bodyB: RigidBody, manifold: ContactManifold, settings: ContactSettings) => void
}[], { bodyA, bodyB, manifold, settings }: { bodyA: RigidBody, bodyB: RigidBody, manifold: ContactManifold, settings: ContactSettings }) {
  for (const event of list) {
    if (
      (bodyA === event.main && event.other.indexOf(bodyB) > -1) ||
      (bodyB === event.main && event.other.indexOf(bodyA) > -1)
    ) {
      event.callback(bodyA, bodyB, manifold, settings)
    }
  }
}
