import { Mesh, Vector3 } from "three";
import { DEBUG } from "../config";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Render } from "./Render";

export function createCameraPosition(render: Render, character: Mesh) {

  if (DEBUG) {
    const controls = new OrbitControls(render.camera, render.renderer.domElement);

    render.camera.position.set(100, 10, 10);
    controls.update();
    return {
      tick: () => {
        controls.update();
      }
    }
  }

  return {
    gameTick: () => {
      const direction = new Vector3()
      character.getWorldDirection(direction)
      direction.negate()

      const perpendicular = new Vector3()
        .crossVectors(new Vector3(0, 1, 0), direction.clone().normalize());

      render.camera.position.copy(
        character.position
          .clone()
          .sub(perpendicular.clone().normalize().multiplyScalar(4))
          .add(new Vector3(0, 2, 0))
      )
      render.camera.lookAt(render.camera.position.clone().add(perpendicular))
    }
  }
}