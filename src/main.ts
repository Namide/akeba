import './style.css';
import './helpers/initThree'

import { updateWorld } from "crashcat";
import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import { createCharacter } from "./entities/createCharacter";
import { createCameraPosition } from "./render/cameraPosition";
import { createCharacterControls } from "./gameplay/createCharacterControls";
import { createTrack } from "./entities/createTrack";
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { createPhysicListener } from './physic/createPhysicListener';

let isPlaying = true

const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const { trackMesh, trackBody, trackMeshes, shipMesh, trackLights, fogMeshes, trackDispose, controlMeshes, homeMeshes, creditsMeshes, outBody } = await createTrack({ physic })
render.scene.add(trackMesh, ...trackMeshes, ...trackLights);

const character3D = await createCharacter({ physic, shipMesh })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);
render.scene.add(character3D.characterBaseMesh);

const characterControls = createCharacterControls({ ...character3D, physic, render, trackMesh })

const cameraPosition = createCameraPosition(render, character3D.characterBaseMesh)



const physicListener = createPhysicListener([
  {
    eventName: 'added',
    main: character3D.characterBody,
    other: [outBody],
    callback: () => {
      characterControls.restart()
    }
  },
  {
    eventName: 'persist',
    main: character3D.characterBody,
    other: [trackBody],
    callback: characterControls.updateNormal
  }
])



const startTime = Date.now()
const { dispose: disposeTick } = attachTick(({ deltaS }) => {
  if (isPlaying) {
    updateWorld(physic.world, physicListener, deltaS);
    characterControls.tick({ deltaS })

    if (cameraPosition.gameTick) {
      cameraPosition.gameTick()
    }
  }

  if (cameraPosition.tick) {
    cameraPosition.tick()
  }

  for (const fog of fogMeshes) {
    fog.rotation.y = fog.userData.velocity * (Date.now() - startTime) / 20000
  }

  render.render()
})


// Screens

const changeScreen = (screen: 'controls' | 'home' | 'credits' | 'play') => {
  const objectsAdd: Object3D[] = []
  const objectsRemove: Object3D[] = []

  switch (screen) {
    case 'play':
      objectsRemove.push(controlMeshes, homeMeshes, creditsMeshes)
      isPlaying = true
      break
    case 'home':
      objectsAdd.push(homeMeshes)
      objectsRemove.push(controlMeshes, creditsMeshes)
      isPlaying = false
      break
    case 'credits':
      objectsAdd.push(creditsMeshes)
      objectsRemove.push(controlMeshes, homeMeshes)
      isPlaying = false
      break
    case 'controls':
      objectsAdd.push(controlMeshes)
      objectsRemove.push(homeMeshes, creditsMeshes)
      isPlaying = false
      break
  }

  let camera: PerspectiveCamera | undefined
  for (const group of objectsAdd) {
    group.traverse(object => {
      if ((object as PerspectiveCamera).isCamera) {
        camera = object as PerspectiveCamera
      }
    })
  }

  if (camera) {
    render.camera.fov = 50
    render.camera.position.copy(camera.position)
    render.camera.quaternion.copy(camera.quaternion)
    render.camera.updateProjectionMatrix();

    for (const object3D of objectsAdd) {
      const pos = camera.getWorldPosition(new Vector3())
      pos.add(
        camera.getWorldDirection(new Vector3()).multiplyScalar(3)
      )

      object3D.position.copy(pos)
      object3D.quaternion.copy(camera.quaternion)
    }
  }

  render.scene.remove(...objectsRemove)
  render.scene.add(...objectsAdd)
}

changeScreen('play')


// return {
//   dispose() {
//     disposeTick()
//     trackDispose()
//   }
// }
