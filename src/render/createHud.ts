import { OrthographicCamera, Scene } from "three";
import { createCounter, createVelocity } from "./createHudDynamicSprites";

const DEPTH = 200

export async function createHud() {

  const scene = new Scene();
  const camera = new OrthographicCamera(
    -1, 1,
    1, -1,
    0, DEPTH
  );
  camera.position.z = DEPTH / 2;

  // const cube = new Mesh(
  //   new BoxGeometry(200, 200, 2),
  //   new MeshBasicMaterial({
  //     color: '#FF0077',
  //     depthTest: false,
  //     transparent: true,
  //   })
  // )
  // scene.add(cube);

  const counter = await createCounter()
  scene.add(counter.mesh)

  const velocity = await createVelocity()
  scene.add(velocity.mesh)

  return {

    scene,
    camera,
    counter,
    velocity,

    resize(width: number, height: number) {

      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2

      camera.updateProjectionMatrix()

      counter.mesh.position.set(
        -width / 2 + counter.width / 2 + 5,
        -height / 2 + counter.height / 2 + 5,
        0
      );

      velocity.mesh.position.set(
        0,
        height / 2 - velocity.height / 2 - 5,
        0
      );

      // cube.position.set(
      //   0,
      //   0,
      //   0
      // );
    },

    drawTimes(/* laps: number[] */) {

    }
  }
}