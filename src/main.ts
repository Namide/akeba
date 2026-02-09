import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import './style.css';
import { createObjects } from "./helpers/createObjects";
import { createCharacter } from "./helpers/createCharacter";
import { createKeyboardInputs } from "./helpers/keyboardControls";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { Vec3 } from "@perplexdotgg/bounce";

const output = document.body.querySelector('.output')!

const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const objects3D = await createObjects({ physic })
render.scene.add(objects3D.groundMesh);
render.scene.add(objects3D.suzanneMesh);
render.scene.add(...objects3D.ballMeshes);
render.scene.add(objects3D.tableMesh);

const character3D = await createCharacter({ physic })
render.scene.add(character3D.characterMesh);

const { keyboardInputs } = createKeyboardInputs()

attachTick(({ deltaS }) => {
  physic.world.takeOneStep(deltaS);

  {
    const speed = 10000;
    const rotation = 2500;

    character3D.characterBody.clearForces(); // forces persist, clear if needed

    const quatTemp = new Quaternion(character3D.characterBody.orientation.x, character3D.characterBody.orientation.y, character3D.characterBody.orientation.z, character3D.characterBody.orientation.w)
    const eulerTemp = new Euler().setFromQuaternion(quatTemp)

    quatTemp.setFromEuler(eulerTemp)
    quatTemp.x = 0
    quatTemp.z = 0


    output.innerHTML = JSON.stringify(
      eulerTemp
      , undefined, '<br>')

    character3D.characterBody.orientation.set(
      quatTemp
    )



    if (keyboardInputs.left || keyboardInputs.right) {
      const localDirection = new Vector3(
        0,
        keyboardInputs.left ? 1 : -1,
        0,
      )
      const worldDirection = localDirection.clone().applyQuaternion(new Quaternion(character3D.characterBody.orientation.x, character3D.characterBody.orientation.y, character3D.characterBody.orientation.z, character3D.characterBody.orientation.w));
      const angularForce = new Vec3(worldDirection).scale(rotation)
      character3D.characterBody.applyAngularForce(angularForce); // { x: 0, y: 1000, z: 0 }  at center of mass
    }

    if (keyboardInputs.forward || keyboardInputs.backward) {
      const localDirection = new Vector3(0, 0, keyboardInputs.forward ? 1 : -1)
      const worldDirection = localDirection.clone().applyQuaternion(new Quaternion(character3D.characterBody.orientation.x, character3D.characterBody.orientation.y, character3D.characterBody.orientation.z, character3D.characterBody.orientation.w));
      const linearForce = new Vec3(worldDirection).scale(speed)
      character3D.characterBody.applyLinearForce(linearForce); // { x: 0, y: 1000, z: 0 }  at center of mass
    }


    // character3D.characterBody.applyAngularForce({ x: 0, y: 0, z: 1000 }); // around local axis
    // character3D.characterBody.applyForce({ x: 0, y: 1000, z: 0 }, { x: 0, y: 7, z: 0 }); // at world point
    // character3D.characterBody.applyForce({ x: 0, y: 1000, z: 0 }, { x: 0, y: 7, z: 0 }, false); // useLocalFrame
  }

  character3D.characterMesh.position.set(character3D.characterBody.position.x, character3D.characterBody.position.y, character3D.characterBody.position.z);
  character3D.characterMesh.quaternion.set(character3D.characterBody.orientation.x, character3D.characterBody.orientation.y, character3D.characterBody.orientation.z, character3D.characterBody.orientation.w);

  objects3D.suzanneMesh.position.set(objects3D.suzanneBody.position.x, objects3D.suzanneBody.position.y, objects3D.suzanneBody.position.z);
  objects3D.suzanneMesh.quaternion.set(objects3D.suzanneBody.orientation.x, objects3D.suzanneBody.orientation.y, objects3D.suzanneBody.orientation.z, objects3D.suzanneBody.orientation.w);

  objects3D.groundMesh.position.set(objects3D.groundBody.position.x, objects3D.groundBody.position.y, objects3D.groundBody.position.z);
  objects3D.groundMesh.quaternion.set(objects3D.groundBody.orientation.x, objects3D.groundBody.orientation.y, objects3D.groundBody.orientation.z, objects3D.groundBody.orientation.w);

  for (let i = 0; i < objects3D.ballBodies.length; i++) {
    const ballBody = objects3D.ballBodies[i];
    objects3D.ballMeshes[i].position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);
    objects3D.ballMeshes[i].quaternion.set(ballBody.orientation.x, ballBody.orientation.y, ballBody.orientation.z, ballBody.orientation.w);
  }

  objects3D.tableMesh.position.set(objects3D.tableBody.position.x, objects3D.tableBody.position.y, objects3D.tableBody.position.z);
  objects3D.tableMesh.quaternion.set(objects3D.tableBody.orientation.x, objects3D.tableBody.orientation.y, objects3D.tableBody.orientation.z, objects3D.tableBody.orientation.w);


  render.render()
})
