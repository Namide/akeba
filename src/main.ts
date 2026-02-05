import { Render } from "./render/Render";
import { Physic } from "./physic/Physic";
import { attachTick } from "./helpers/attachTick";
import './style.css';
import { createObjects } from "./helpers/createObjects";


const render = new Render(document.body.querySelector('canvas')!)
render.resize()

const physic = new Physic()

const objects3D = await createObjects({ physic })
render.scene.add(objects3D.groundMesh);
render.scene.add(objects3D.suzanneMesh);
render.scene.add(...objects3D.ballMeshes);
render.scene.add(objects3D.tableMesh);

attachTick(({ deltaS }) => {
  physic.world.takeOneStep(deltaS);

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
