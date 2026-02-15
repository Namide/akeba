export const createInputs = () => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
})

export type Inputs = ReturnType<(typeof createInputs)>
