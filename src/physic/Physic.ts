import { Vec3, World } from '@perplexdotgg/bounce';
import { log } from '../helpers/log';

export class Physic {

  world

  constructor() {
    this.world = new World({
      gravity: new Vec3({ x: 0, y: -100, z: 0 }),
      maxLinearSpeed: 500
    });
    log(JSON.stringify(this.world.maxLinearSpeedSquared))
  }
}