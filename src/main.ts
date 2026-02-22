import './style.css';
import { BatchedMesh, BufferGeometry, Mesh } from 'three';
import {
  computeBoundsTree, disposeBoundsTree,
  computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
} from 'three-mesh-bvh';

BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
BatchedMesh.prototype.raycast = acceleratedRaycast;

import { updateWorld } from "crashcat";
import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import { createCharacter } from "./entities/createCharacter";
import { createCameraPosition } from "./render/cameraPosition";
import { createCharacterControls } from "./gameplay/createCharacterControls";
import { createTrack } from "./entities/createTrack";


const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const { trackMesh, trackMeshes, shipMesh, trackLights, fogMeshes } = await createTrack({ physic })
render.scene.add(trackMesh, ...trackMeshes, ...trackLights);

const character3D = await createCharacter({ physic, shipMesh })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);
render.scene.add(character3D.characterBaseMesh);

const characterTick = createCharacterControls({ ...character3D, physic, render, trackMesh })

const cameraPosition = createCameraPosition(render, character3D.characterBaseMesh)

const startTime = Date.now()
attachTick(({ deltaS }) => {
  updateWorld(physic.world, undefined, deltaS);
  characterTick.tick({ deltaS })
  cameraPosition.tick()
  for (const fog of fogMeshes) {
    fog.rotation.y = fog.userData.velocity * (Date.now() - startTime) / 20000
  }
  render.render()
})
