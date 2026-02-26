import nipplejs from 'nipplejs';
import { JoystickManagerEventTypes } from 'nipplejs';
import { Inputs } from './inputs';

export function createTouchInputs(inputs: Inputs) {

  let vector: { x: number, y: number } | undefined
  let joystick: nipplejs.JoystickManager | undefined

  const onStartEnd = () => {
    vector = undefined

    inputs.left = false
    inputs.right = false
    inputs.action = false
    inputs.cancel = false
  }

  const onMove = (_: any, data: { vector: { x: number, y: number } }) => {
    vector = data.vector
  }

  const disable = () => {
    if (joystick) {
      joystick.off('start end' as JoystickManagerEventTypes, onStartEnd)
      joystick.off('move', onMove)
      joystick.destroy()
      joystick = undefined

    }

    for (const div of document.body.querySelectorAll('.pause')) {
      div.remove()
    }

    vector = undefined
  }

  const enable = () => {
    disable()

    if (!isTouchDevice()) {
      return
    }

    const div = document.createElement('div')
    div.classList.add('pause')
    div.addEventListener('click', () => {
      inputs.select = true
      requestAnimationFrame(() => inputs.select = false)
    })
    document.body.appendChild(div)

    joystick = nipplejs.create({
      zone: document.body.querySelector('.joystick') as HTMLDivElement,
      mode: 'semi',
      catchDistance: 150,
      color: '#99C46E33'
    });
    (joystick
      .on('start end' as JoystickManagerEventTypes, onStartEnd) as unknown as nipplejs.JoystickManager)
      .on('move', onMove)
  }

  return {
    inputs,
    enable,
    disable,
    tick() {
      if (vector) {
        inputs.left = vector.x < -0.25
        inputs.right = vector.x > 0.25
        inputs.action = vector.y > 0.25
        inputs.cancel = vector.y < -0.25
      }
    },
    dispose() {
      disable()
    }
  }
}

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches
}