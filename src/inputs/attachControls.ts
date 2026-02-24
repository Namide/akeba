import { createGamepadInputs } from "./gamepadControls"
import { createInputs } from "./inputs"
import { createKeyboardInputs } from "./keyboardControls"

export function attachControls(on: {
  action: () => void,
  left: () => void,
  right: () => void,
  cancel: () => void,
  backward: () => void,
  forward: () => void,
  select: () => void,
  start: () => void,
}) {
  const lastInputs = createInputs()
  const newInputs = createInputs()
  const { tick } = createGamepadInputs(newInputs)
  const { dispose } = createKeyboardInputs(newInputs)

  return {
    tick: () => {
      tick()
      for (const _key of Object.keys(lastInputs)) {
        const key = _key as keyof typeof lastInputs
        if (newInputs[key] && !lastInputs[key]) {
          on[key]()
        }
        lastInputs[key] = newInputs[key]
      }
    },
    dispose
  }
}