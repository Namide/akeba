import { addBroadphaseLayer, addObjectLayer, createWorld, createWorldSettings, enableCollision, registerAll } from 'crashcat';

registerAll();

export const worldSettings = createWorldSettings()
const BROADPHASE_LAYER_NOT_MOVING = addBroadphaseLayer(worldSettings);

const BROADPHASE_LAYER_MOVING = addBroadphaseLayer(worldSettings);
export const OBJECT_LAYER_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_MOVING);
export const OBJECT_LAYER_NOT_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_NOT_MOVING);

enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_MOVING);
enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_NOT_MOVING);

worldSettings.gravity[1] = -100

export class Physic {

  world

  constructor() {
    this.world = createWorld(
      worldSettings
    );
  }
}