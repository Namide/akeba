import { RigidBody } from "crashcat";

export function createLapManager(checkpoints: RigidBody[]) {

  let bestChrono = Number(localStorage.getItem("bestChrono") || 0)
  let lastChrono = 0

  let lapCount = 0
  let currentCheckpointIndex = 0
  let chronoStartLapTime = Date.now()
  let pauseStartedAt = 0

  const restart = () => {
    lapCount = 0
    currentCheckpointIndex = 0
    chronoStartLapTime = Date.now()
    pauseStartedAt = 0
  }

  const lapManager = {
    restart,
    pause() {
      pauseStartedAt = Date.now()
    },
    play() {
      chronoStartLapTime += Date.now() - pauseStartedAt
      pauseStartedAt = 0
    },
    getCurrentChrono() {
      return (pauseStartedAt || Date.now()) - chronoStartLapTime
    },
    getLastChronos() {
      return lastChrono
    },
    getBestChronos() {
      return bestChrono
    },
    hitCheckpoint(bodies: RigidBody[]) {
      for (const body of bodies) {
        const index = checkpoints.indexOf(body)
        if (index > -1 && index === ((currentCheckpointIndex + 1) % checkpoints.length)) {
          currentCheckpointIndex = index;
          if (currentCheckpointIndex === 0) {
            const now = Date.now()
            const currentChrono = now - chronoStartLapTime

            if (lastChrono || bestChrono) {
              bestChrono = Math.min(bestChrono || Infinity, lastChrono || Infinity, currentChrono)
              localStorage.setItem("bestChrono", bestChrono.toFixed(0));
            }

            lapCount += 1
            lastChrono = currentChrono
            chronoStartLapTime = now
            pauseStartedAt = 0
          }
        }
      }
    }
  }

  return lapManager
}