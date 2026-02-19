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

import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import './style.css';
import { createCharacter } from "./entities/createCharacter";
import { createCameraPosition } from "./render/cameraPosition";
import { createCharacterControls } from "./gameplay/createCharacterControls";
import { createTrack } from "./entities/createTrack";


const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const { trackMesh, trackMeshes, shipMesh, trackLights } = await createTrack()
render.scene.add(trackMesh, ...trackMeshes, ...trackLights);

const character3D = await createCharacter({ shipMesh })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);
render.scene.add(character3D.characterBaseMesh);

const physic = new Physic(character3D.characterBody, [trackMesh, ...trackMeshes])

const characterTick = createCharacterControls({ ...character3D, physic, render, trackMesh })

const cameraPosition = createCameraPosition(render, character3D.characterBaseMesh)

// const { skybox } = await createSkybox()
// render.scene.add(skybox)

attachTick(({ deltaS }) => {
  physic.tick(deltaS)
  characterTick.tick({ deltaS })
  cameraPosition.tick()
  render.render()
})
