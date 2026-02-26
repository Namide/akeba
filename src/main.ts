import './style.css';
import './helpers/initThree'

import { RigidBody, updateWorld } from "crashcat";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import { createCharacter } from "./entities/createCharacter";
import { createCameraPosition } from "./render/cameraPosition";
import { createCharacterControls } from "./gameplay/createCharacterControls";
import { createTrack } from "./entities/createTrack";
import { BufferGeometry, Mesh, MeshLambertMaterial, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { createPhysicListener } from './physic/createPhysicListener';
import { MenuEventsManager } from './inputs/MenuEventsManager';
import { createRenderEngine } from './render/Render';
import { createLapManager } from './gameplay/createLapManager';

let isPlaying = true

const render = await createRenderEngine(document.body.querySelector('canvas')!)

const physic = new Physic()

const { trackMesh, trackBody, trackMeshes, shipMesh, trackLights, fogMeshes, controlMeshes, homeMeshes, pauseMeshes, creditsMeshes, outBody, checkpointBodies } = await createTrack({ physic })
render.scene.add(trackMesh, ...trackMeshes, ...trackLights);

const character3D = await createCharacter({ physic, shipMesh })
render.scene.add(character3D.characterMesh);
render.scene.add(character3D.characterBodyMesh);
render.scene.add(character3D.characterBaseMesh);

const characterControls = createCharacterControls({ ...character3D, physic, render, trackMesh })

const cameraPosition = createCameraPosition(render, character3D.characterBaseMesh)

const lapManager = createLapManager(checkpointBodies)

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
    eventName: 'added',
    main: character3D.characterBody,
    other: checkpointBodies,
    callback: (bodyA: RigidBody, bodyB: RigidBody) => {
      lapManager.hitCheckpoint([bodyA, bodyB])
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
let i = 0
attachTick(({ deltaS }) => {
  if (isPlaying) {
    updateWorld(physic.world, physicListener, deltaS);
    characterControls.tick({ deltaS })

    if (cameraPosition.gameTick) {
      cameraPosition.gameTick()
    }

    if (characterControls.inputs.select) {
      changeScreen('pause')
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

  render.hud.counter.update(lapManager.getCurrentChrono())
  if (++i % 15 === 0) {
    render.hud.velocity.update(characterControls.physicVelocity.length() * Math.PI)
  }
  render.render({ withHud: isPlaying })
})


// Screens

const gotToHome = () => changeScreen('home')
const gotToControls = () => changeScreen('controls')
const gotToCredits = () => changeScreen('credits')
const gotPlay = () => changeScreen('play')
const gotRestart = () => changeScreen('restart')

const setHover = (obj: Object3D) => (obj as Mesh<BufferGeometry, MeshLambertMaterial>).material.color.set('#ffff00')
const setOut = (obj: Object3D) => (obj as Mesh<BufferGeometry, MeshLambertMaterial>).material.color.set('#ffffff')

menuEventManager.addEvent('hover', 'button-play', setHover)
menuEventManager.addEvent('out', 'button-play', setOut)
menuEventManager.addEvent('click', 'button-play', gotRestart)
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
menuEventManager.addEvent('hover', 'button-quit', setHover)
menuEventManager.addEvent('out', 'button-quit', setOut)
menuEventManager.addEvent('click', 'button-quit', gotToHome)
menuEventManager.addEvent('hover', 'button-continue', setHover)
menuEventManager.addEvent('out', 'button-continue', setOut)
menuEventManager.addEvent('click', 'button-continue', gotPlay)
menuEventManager.addEvent('hover', 'button-restart', setHover)
menuEventManager.addEvent('out', 'button-restart', setOut)
menuEventManager.addEvent('click', 'button-restart', gotRestart)

let menuData: { tick: () => void, dispose: () => void } | undefined
function changeScreen(screen: 'controls' | 'home' | 'credits' | 'play' | 'pause' | 'restart') {
  const objectsAdd: Object3D[] = []
  const objectsRemove: Object3D[] = []

  if (menuData) {
    menuData.dispose()
  }

  switch (screen) {
    case 'restart':
      menuEventManager.disable()
      objectsRemove.push(controlMeshes, homeMeshes, creditsMeshes, pauseMeshes)
      characterControls.restart()
      characterControls.touchControls.enable()
      lapManager.restart()
      isPlaying = true
      break
    case 'play':
      menuEventManager.disable()
      objectsRemove.push(controlMeshes, homeMeshes, creditsMeshes, pauseMeshes)
      characterControls.touchControls.enable()
      lapManager.play()
      isPlaying = true
      break
    case 'pause':
      menuEventManager.enable([pauseMeshes])
      objectsAdd.push(pauseMeshes)
      objectsRemove.push(controlMeshes, homeMeshes, creditsMeshes, pauseMeshes)
      characterControls.touchControls.disable()
      lapManager.pause()
      isPlaying = false
      break
    case 'home':
      menuEventManager.enable([homeMeshes])
      objectsAdd.push(homeMeshes)
      objectsRemove.push(controlMeshes, creditsMeshes, pauseMeshes)
      characterControls.touchControls.disable()
      isPlaying = false
      break
    case 'credits':
      menuEventManager.enable([creditsMeshes])
      objectsAdd.push(creditsMeshes)
      objectsRemove.push(controlMeshes, homeMeshes, pauseMeshes)
      characterControls.touchControls.disable()
      isPlaying = false
      break
    case 'controls':
      menuEventManager.enable([controlMeshes])
      objectsAdd.push(controlMeshes)
      objectsRemove.push(homeMeshes, creditsMeshes, pauseMeshes)
      characterControls.touchControls.disable()
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
  }

  for (const object3D of objectsAdd) {
    const pos = render.camera.getWorldPosition(new Vector3())
    pos.add(
      render.camera.getWorldDirection(new Vector3()).multiplyScalar(3)
    )

    object3D.position.copy(pos)
    object3D.quaternion.copy(render.camera.quaternion)
  }

  render.scene.remove(...objectsRemove)

  if (objectsAdd.length > 0) {
    render.scene.add(...objectsAdd)
  }
}

changeScreen('home')
