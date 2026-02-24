export const createInputs = () => ({
  // Gameplay
  action: false,
  left: false,
  right: false,
  cancel: false,

  // Menu
  backward: false,
  forward: false,
  select: false,
  start: false,
})

export type Inputs = ReturnType<(typeof createInputs)>
