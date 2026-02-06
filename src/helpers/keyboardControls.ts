export function createKeyboardInputs() {

  const keyboardInputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  };

  document.addEventListener('keydown', keyDownListener, false);
  document.addEventListener('keyup', keyUpListener, false);

  return {
    keyboardInputs,
    dispose: () => {
      document.removeEventListener('keydown', keyDownListener, false);
      document.removeEventListener('keyup', keyUpListener, false);
    }
  }

  function keyDownListener(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keyboardInputs.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keyboardInputs.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keyboardInputs.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keyboardInputs.right = true;
        break;
      case 'Space':
        keyboardInputs.jump = true;
        break;
    }
  }

  function keyUpListener(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keyboardInputs.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keyboardInputs.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keyboardInputs.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keyboardInputs.right = false;
        break;
      case 'Space':
        keyboardInputs.jump = false;
        break;
    }
  }
}