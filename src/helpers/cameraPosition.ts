import { Mesh, PerspectiveCamera, Vector3 } from "three";

export function createCameraPosition(camera: PerspectiveCamera, character: Mesh) {
  return {
    tick: () => {
      const direction = new Vector3()
      character.getWorldDirection(direction)
      direction.negate()


      const perpendicular = new Vector3()
        .crossVectors(new Vector3(0, 1, 0), direction.clone().normalize());

      camera.position.copy(
        character.position
          .clone()
          .sub(perpendicular.clone().normalize().multiplyScalar(7))
          .add(new Vector3(0, 3, 0))
      )
      camera.lookAt(camera.position.clone().add(perpendicular))
    }
  }
}