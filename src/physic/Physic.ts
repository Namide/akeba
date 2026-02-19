import { addBroadphaseLayer, addObjectLayer, createWorld, createWorldSettings, enableCollision, registerAll } from 'crashcat';
import { Mesh, MeshLambertMaterial, Sphere, SphereGeometry, Vector3 } from 'three';
import { MeshBVH, StaticGeometryGenerator } from 'three-mesh-bvh';

registerAll();

export const worldSettings = createWorldSettings()
const BROADPHASE_LAYER_NOT_MOVING = addBroadphaseLayer(worldSettings);

const BROADPHASE_LAYER_MOVING = addBroadphaseLayer(worldSettings);
export const OBJECT_LAYER_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_MOVING);
export const OBJECT_LAYER_NOT_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_NOT_MOVING);

enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_MOVING);
enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_NOT_MOVING);

worldSettings.gravity[1] = -100

const tempSphere = new Sphere();
const deltaVec = new Vector3();
const tempVec = new Vector3();

export class CharacterBody {
  velocity: Vector3 = new Vector3()
  body
  mass

  collision: {
    point: Vector3,
    normal: Vector3
  } | undefined

  constructor(position: Vector3, radius: number, mass = Math.pow(radius, 3) * Math.PI * 4 / 3) {
    this.body = new Sphere(position, radius)
    this.mass = mass;
  }
}

// https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/physics.js
export class Physic {
  characterBody
  ground;
  gravity = -100

  constructor(characterBody: CharacterBody, statics: Mesh[]) {

    this.characterBody = characterBody

    // ---

    const staticGenerator = new StaticGeometryGenerator(statics);
    staticGenerator.attributes = ['position'];
    const mergedGeometry = staticGenerator.generate();
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry);
    this.ground = new Mesh(mergedGeometry);


    // this.world = createWorld(
    //   worldSettings
    //   //   {
    //   //   // gravity: new Vec3({ x: 0, y: -100, z: 0 }),
    //   //   // maxLinearSpeed: 500,

    //   //   // // https://codeberg.org/perplexdotgg/bounce/src/branch/main/docs/documentation.md
    //   //   // // more is higher fidelity, but uses more CPU
    //   //   // solveVelocityIterations: 6, // 6
    //   //   // solvePositionIterations: 2, // 2
    //   // }
    // );
    // log(JSON.stringify(this.world.maxLinearSpeedSquared))
  }

  tick(deltaS: number) {
    this.updateCollisions(deltaS)
  }

  updateCollisions(deltaTime: number) {

    const bvh = this.ground.geometry.boundsTree!;

    // Apply gravity and move sphere
    this.characterBody.velocity.y += this.gravity * deltaTime;
    this.characterBody.body.center.addScaledVector(this.characterBody.velocity, deltaTime);

    // Remove spheres that fell out of the world
    // if (this.characterBody.body.center.y < - 80) {

    //   spheres.splice(i, 1);
    //   i--;
    //   l--;

    //   this.characterBody.material.dispose();
    //   this.characterBody.geometry.dispose();
    //   scene.remove(sphere);
    //   continue;

    // }

    // Check collision with environment
    tempSphere.copy(this.characterBody.body);

    let collided = false;
    bvh.shapecast({
      intersectsBounds: box => box.intersectsSphere(tempSphere),
      intersectsTriangle: tri => {
        tri.closestPointToPoint(tempSphere.center, deltaVec);
        deltaVec.sub(tempSphere.center);
        const distance = deltaVec.length();
        if (distance < tempSphere.radius) {
          const radius = tempSphere.radius;
          const depth = distance - radius;
          deltaVec.multiplyScalar(1 / distance);
          tempSphere.center.addScaledVector(deltaVec, depth);
          collided = true;
        }
      },

      boundsTraverseOrder: box => box.distanceToPoint(tempSphere.center) - tempSphere.radius,
    });

    if (collided) {

      deltaVec.subVectors(tempSphere.center, this.characterBody.body.center).normalize();
      this.characterBody.velocity.reflect(deltaVec);

      const dot = this.characterBody.velocity.dot(deltaVec);
      this.characterBody.velocity.addScaledVector(deltaVec, - dot * 0.5);
      this.characterBody.velocity.multiplyScalar(Math.max(1.0 - deltaTime, 0));

      this.characterBody.body.center.copy(tempSphere.center);

      tempVec.copy(tempSphere.center).addScaledVector(deltaVec, - tempSphere.radius);
      // onCollide(this.characterBody, null, tempVec, deltaVec, dot, 0.05);

      this.characterBody.collision = {
        normal: tempVec.clone(),
        point: deltaVec.clone()
      }

    } else {

      this.characterBody.collision = undefined

    }



    // Handle sphere-sphere collisions
    // for (let i = 0, l = spheres.length; i < l; i++) {

    //   const s1 = spheres[i];
    //   const c1 = s1.body;

    //   for (let j = i + 1; j < l; j++) {

    //     const s2 = spheres[j];
    //     const c2 = s2.body;

    //     deltaVec.subVectors(c1.center, c2.center);
    //     const depth = deltaVec.length() - (c1.radius + c2.radius);

    //     if (depth < 0) {

    //       deltaVec.normalize();

    //       const v1dot = s1.velocity.dot(deltaVec);
    //       const v2dot = s2.velocity.dot(deltaVec);

    //       const offsetRatio1 = Math.max(v1dot, 0.2);
    //       const offsetRatio2 = Math.max(v2dot, 0.2);

    //       const total = offsetRatio1 + offsetRatio2;
    //       const ratio1 = offsetRatio1 / total;
    //       const ratio2 = offsetRatio2 / total;

    //       c1.center.addScaledVector(deltaVec, - ratio1 * depth);
    //       c2.center.addScaledVector(deltaVec, ratio2 * depth);

    //       const velocityDifference = new THREE.Vector3();
    //       velocityDifference
    //         .addScaledVector(deltaVec, - v1dot)
    //         .addScaledVector(deltaVec, v2dot);

    //       const velDiff = velocityDifference.length();
    //       const m1 = s1.mass;
    //       const m2 = s2.mass;

    //       let newVel1, newVel2;
    //       const damping = 0.5;

    //       if (velocityDifference.dot(s1.velocity) > velocityDifference.dot(s2.velocity)) {

    //         newVel1 = damping * velDiff * (m1 - m2) / (m1 + m2);
    //         newVel2 = damping * velDiff * 2 * m1 / (m1 + m2);
    //         newVel1 -= velDiff;

    //       } else {

    //         newVel1 = damping * velDiff * 2 * m2 / (m1 + m2);
    //         newVel2 = damping * velDiff * (m2 - m1) / (m1 + m2);
    //         newVel2 -= velDiff;

    //       }

    //       velocityDifference.normalize();
    //       s1.velocity.addScaledVector(velocityDifference, newVel1);
    //       s2.velocity.addScaledVector(velocityDifference, newVel2);

    //       tempVec.copy(c1.center).addScaledVector(deltaVec, - c1.radius);
    //       onCollide(s1, s2, tempVec, deltaVec, velDiff, 0);

    //     }

    //   }

    //   s1.position.copy(c1.center);

    // }

  }


  // onCollide(object1, object2, point, normal, velocity, offset = 0) {

  //   if (velocity < Math.max(Math.abs(0.04 * params.gravity), 5)) return;

  //   // Create collision effect
  //   const effectScale = Math.max(
  //     object2 ?
  //       Math.max(object1.body.radius, object2.body.radius) :
  //       object1.body.radius,
  //     0.4
  //   ) * 2.0;

  //   const plane = new THREE.Mesh(
  //     new RingGeometry(0, 1, 30),
  //     new MeshBasicMaterial({ side: 2, transparent: true, depthWrite: false })
  //   );
  //   plane.lifetime = 0;
  //   plane.maxLifetime = 0.4;
  //   plane.maxScale = effectScale * Math.max(Math.sin(Math.min(velocity / 200, 1) * Math.PI / 2), 0.35);

  //   plane.position.copy(point).addScaledVector(normal, offset);
  //   plane.quaternion.setFromUnitVectors(forwardVector, normal);
  //   scene.add(plane);
  //   hits.push(plane);
  // }
}

