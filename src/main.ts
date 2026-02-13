import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import './style.css';
import { createEntities } from "./helpers/createEntities";
import { createCharacter } from "./helpers/createCharacterBall";
import { createCameraPosition } from "./helpers/cameraPosition";
import { createCharacterControls } from "./helpers/createCharacterControls";

const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const entities = await createEntities({ physic })
render.scene.add(...entities.meshes);

const character3D = await createCharacter({ physic })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);

const characterTick = createCharacterControls(character3D)

const cameraPosition = createCameraPosition(render.camera, character3D.characterMesh)

attachTick(({ deltaS }) => {
  physic.world.takeOneStep(deltaS);

  characterTick.tick()
  cameraPosition.tick()
  entities.tick()

  render.render()
})
