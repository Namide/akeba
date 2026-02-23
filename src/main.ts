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
import { BufferGeometry, Mesh, MeshLambertMaterial, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { createPhysicListener } from './physic/createPhysicListener';
import { MenuEventsManager } from './inputs/MenuEventsManager';

let isPlaying = true

const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const { trackMesh, trackBody, trackMeshes, shipMesh, trackLights, fogMeshes, controlMeshes, homeMeshes, creditsMeshes, outBody } = await createTrack({ physic })
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

const menuEventManager = new MenuEventsManager(render.camera)

const startTime = Date.now()
attachTick(({ deltaS }) => {
  if (isPlaying) {
    updateWorld(physic.world, physicListener, deltaS);
    characterControls.tick({ deltaS })

    if (cameraPosition.gameTick) {
      cameraPosition.gameTick()
    }
  } else {
    menuEventManager.tick()
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


const gotToHome = () => changeScreen('home')
const gotToControls = () => changeScreen('controls')
const gotToCredits = () => changeScreen('credits')
const gotPlay = () => changeScreen('play')

const setHover = (obj: Object3D) => (obj as Mesh<BufferGeometry, MeshLambertMaterial>).material.color.set('#ffff00')
const setOut = (obj: Object3D) => (obj as Mesh<BufferGeometry, MeshLambertMaterial>).material.color.set('#ffffff')

menuEventManager.addEvent('hover', 'button-play', setHover)
menuEventManager.addEvent('out', 'button-play', setOut)
menuEventManager.addEvent('click', 'button-play', gotPlay)
menuEventManager.addEvent('hover', 'button-controls', setHover)
menuEventManager.addEvent('out', 'button-controls', setOut)
menuEventManager.addEvent('click', 'button-controls', gotToControls)
menuEventManager.addEvent('hover', 'button-credits', setHover)
menuEventManager.addEvent('out', 'button-credits', setOut)
menuEventManager.addEvent('click', 'button-credits', gotToCredits)
menuEventManager.addEvent('hover', 'button-return', setHover)
menuEventManager.addEvent('out', 'button-return', setOut)
menuEventManager.addEvent('click', 'button-return', gotToHome)
menuEventManager.addEvent('hover', 'button-return-2', setHover)
menuEventManager.addEvent('out', 'button-return-2', setOut)
menuEventManager.addEvent('click', 'button-return-2', gotToHome)

function changeScreen(screen: 'controls' | 'home' | 'credits' | 'play') {
  const objectsAdd: Object3D[] = []
  const objectsRemove: Object3D[] = []

  switch (screen) {
    case 'play':
      menuEventManager.disable()
      objectsRemove.push(controlMeshes, homeMeshes, creditsMeshes)
      isPlaying = true
      break
    case 'home':
      menuEventManager.enable()
      menuEventManager.objects3D = [homeMeshes]
      objectsAdd.push(homeMeshes)
      objectsRemove.push(controlMeshes, creditsMeshes)
      isPlaying = false
      break
    case 'credits':
      menuEventManager.enable()
      menuEventManager.objects3D = [creditsMeshes]
      objectsAdd.push(creditsMeshes)
      objectsRemove.push(controlMeshes, homeMeshes)
      isPlaying = false
      break
    case 'controls':
      menuEventManager.enable()
      menuEventManager.objects3D = [controlMeshes]
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
      const pos = render.camera.getWorldPosition(new Vector3())
      pos.add(
        render.camera.getWorldDirection(new Vector3()).multiplyScalar(3)
      )

      object3D.position.copy(pos)
      object3D.quaternion.copy(render.camera.quaternion)
    }
  }

  render.scene.remove(...objectsRemove)
  render.scene.add(...objectsAdd)
}

changeScreen('home')


// return {
//   dispose() {
//     disposeTick()
//     trackDispose()
//   }
// }
