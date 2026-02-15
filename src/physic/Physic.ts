import { Vec3, World } from '@perplexdotgg/bounce';
import { log } from '../helpers/log';

export class Physic {

  world

  constructor() {
    this.world = new World({
      gravity: new Vec3({ x: 0, y: -100, z: 0 }),
      maxLinearSpeed: 500,

      // https://codeberg.org/perplexdotgg/bounce/src/branch/main/docs/documentation.md
      // more is higher fidelity, but uses more CPU
      solveVelocityIterations: 6, // 6
      solvePositionIterations: 2, // 2

      // most of these options are for stability
      linearDamping: 0.05,
      angularDamping: 0.05,
      baumgarte: 0.2,
      penetrationSlop: 0.02,
      maxPenetrationDistance: 0.2,
      speculativeContactDistance: 0.02,
      collisionTolerance: 1e-4,
      maxAngularSpeed: 30.0,
      isWarmStartingEnabled: true,
    });
    log(JSON.stringify(this.world.maxLinearSpeedSquared))
  }
}