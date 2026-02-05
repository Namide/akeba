export function attachTick(tick: (options: { deltaS: number, now: number }) => void) {
  let now: number;
  let previousNow: number;
  let deltaS: number;
  let raf: number

  const onTick = () => {
    raf = requestAnimationFrame(onTick)

    now = performance.now();
    if (previousNow === undefined) {
      previousNow = now - 16;
    }

    deltaS = (now - previousNow) / 1000;
    deltaS = Math.min(deltaS, 0.033); // cap deltaS to avoid large time jumps (e.g. when user is in another tab)

    previousNow = now;

    tick({ now, deltaS })
  }
  onTick()

  return {
    dispose: () => cancelAnimationFrame(raf)
  }
}