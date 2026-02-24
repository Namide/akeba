import type { Inputs } from "./inputs";

const PADS = [
  // Gameplay
  [14, 'left'],
  [15, 'right'],
  [0, 'action'],
  [2, 'cancel'],

  // Menu
  [12, 'forward'],
  [13, 'backward'],
  [8, 'select'],
  [9, 'start'],
] as const

export function createGamepadInputs(inputs: Inputs) {
  const buttonPressed = PADS.reduce((bp, [_, name]) => {
    bp[name] = false
    return bp
  }, {} as Record<typeof PADS[number][1], boolean>)

  return {
    inputs,
    tick: () => {
      const gamepad = navigator.getGamepads()[0] || navigator.getGamepads()[1] || navigator.getGamepads()[2] || navigator.getGamepads()[3]

      if (!gamepad) {
        return
      }

      for (const [index, name] of PADS) {
        const { pressed } = gamepad.buttons[index]
        if (!buttonPressed[name] && pressed) {
          buttonPressed[name] = true
          inputs[name] = true
        } else if (buttonPressed[name] && !pressed) {
          buttonPressed[name] = false
          inputs[name] = false
        }
      }
    },
  }
}