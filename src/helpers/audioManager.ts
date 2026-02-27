import music from '../assets/sounds/illegal-racing-aerosteak.mp3'
import motor from '../assets/sounds/motor.mp3'
import scrape from '../assets/sounds/scrape.mp3'
import silence from '../assets/sounds/silence.mp3'
import { SimpleTween, linear } from "twon"
import { isTouchDevice } from '../inputs/touchControls'

export type SoundName = 'music' | 'motor' | 'scrape' | 'silence'

const audioSrcList: Record<SoundName, string> = {
  music,
  motor,
  scrape,
  silence,
}

export const createAudioManager = async () => {
  const context = new AudioContext()
  const buffers: { [key in SoundName]?: AudioBuffer } = {}
  const sources: { [key in SoundName]?: AudioBufferSourceNode } = {}
  const gains: { [key in SoundName]?: GainNode } = {}

  for (const name in audioSrcList) {
    const key = name as unknown as SoundName
    const src = audioSrcList[key]
    const response = await fetch(src)
    const buffer = await response.arrayBuffer()
    context.decodeAudioData(
      buffer,
      (audioBuffer) => {
        if (buffer) {
          buffers[key] = audioBuffer
        }
      },
      (error) => console.error(error)
    )
  }

  const getGain = (name: SoundName, destination: AudioDestinationNode) => {
    if (!gains[name]) {
      gains[name] = context.createGain()
      gains[name].connect(destination)
      gains[name].gain.value = 0
    }

    return gains[name]
  }

  const play = (name: SoundName, loop = false) => {
    if (!sources[name]) {
      sources[name] = context.createBufferSource()
      sources[name].buffer = buffers[name] || null
      sources[name].connect(getGain(name, context.destination))
      sources[name].start(0)
      sources[name].loop = loop
    }
  }

  // const stop = (name: SoundName) => {
  //   if (sources[name]) {
  //     sources[name].stop()
  //   }
  // }

  const volume = (name: SoundName, value: number, ease = 0) => {
    if (gains[name]) {

      if (ease) {
        new SimpleTween(
          [
            gains[name]!.gain.value,
            value
          ],
          {
            delay: 0,
            duration: ease,
            ease: linear,
          }
        ).on('update', (currentValue: number) => {
          gains[name]!.gain.value = currentValue
        })
      } else {
        gains[name].gain.value = value
      }
    }
  }

  if (isTouchDevice()) {
    // https://curtisrobinson.medium.com/how-to-auto-play-audio-in-safari-with-javascript-21d50b0a2765
    const playSilence = () => {
      play('silence')
      document.body.removeEventListener('touchstart', playSilence, false)
    }
    document.body.addEventListener('touchstart', playSilence, false)
  } else {
    const playSilence = () => {
      play('silence')
      document.body.removeEventListener('mousedown', playSilence, false)
    }
    document.body.addEventListener('mousedown', playSilence, false)
  }

  return {
    play,
    stop,
    volume
  }
}
