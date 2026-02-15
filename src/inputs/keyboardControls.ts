import type { Inputs } from "./inputs";

export function createKeyboardInputs(inputs: Inputs) {

  document.addEventListener('keydown', keyDownListener, false);
  document.addEventListener('keyup', keyUpListener, false);

  return {
    inputs,
    dispose: () => {
      document.removeEventListener('keydown', keyDownListener, false);
      document.removeEventListener('keyup', keyUpListener, false);
    }
  }

  function keyDownListener(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputs.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputs.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputs.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputs.right = true;
        break;
      case 'Space':
        inputs.brake = true;
        break;
    }
  }

  function keyUpListener(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputs.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputs.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputs.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputs.right = false;
        break;
      case 'Space':
        inputs.brake = false;
        break;
    }
  }
}