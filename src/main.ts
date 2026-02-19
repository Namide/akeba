import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import './style.css';
import { createEntities } from "./entities/createEntities";
import { createCharacter } from "./entities/createCharacter";
import { createCameraPosition } from "./render/cameraPosition";
import { createCharacterControls } from "./gameplay/createCharacterControls";
import { updateWorld } from "crashcat";
import { createTrack } from "./entities/createTrack";
import { createSkybox } from "./render/createSkybox";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const entities = await createEntities({ physic })
render.scene.add(...entities.meshes);

const { trackMesh, trackMeshes, shipMesh, trackLights } = await createTrack({ physic })
render.scene.add(trackMesh, ...trackMeshes, ...trackLights);

const character3D = await createCharacter({ physic, shipMesh })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);
render.scene.add(character3D.characterBaseMesh);

const characterTick = createCharacterControls({ ...character3D, physic, render, trackMesh })

const cameraPosition = createCameraPosition(render, character3D.characterBaseMesh)

// const { skybox } = await createSkybox()
// render.scene.add(skybox)

attachTick(({ deltaS }) => {
  const steps = 1

  for (let i = 0; i < steps; i++) {
    updateWorld(physic.world, undefined, deltaS / steps);
  }

  characterTick.tick({ deltaS })
  cameraPosition.tick()
  entities.tick()

  render.render()
})
