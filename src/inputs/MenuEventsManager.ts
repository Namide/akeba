import { Object3D, PerspectiveCamera } from "three";
import { MenuEvent, MenuMouseManager } from "./MenuMouseManager";
import { attachControls } from "./attachControls"

export class MenuEventsManager extends MenuMouseManager {

  #controlsData: ReturnType<typeof attachControls> | undefined

  #currentClickableObjects: { mesh: Object3D, event: MenuEvent }[] = []
  #currentSelected: Object3D | undefined

  #on

  constructor(camera: PerspectiveCamera) {
    super(camera)

    this.#on = {
      action: () => { this.#action() },
      left: () => { this.#prev() },
      right: () => { this.#next() },
      cancel: () => { this.#cancel() },
      backward: () => { this.#next() },
      forward: () => { this.#prev() },
      select: () => { this.#next() },
      start: () => { this.#action() },
    }
  }
  #prev() {
    this.#out(this.#currentSelected)

    const index = !this.#currentSelected ? this.#currentClickableObjects.length - 1 : ((this.#currentClickableObjects.findIndex(o => o.mesh === this.#currentSelected) + this.#currentClickableObjects.length - 1) % this.#currentClickableObjects.length)
    this.#currentSelected = this.#currentClickableObjects[index].mesh

    this.#hover(this.#currentSelected)
  }

  #next() {
    this.#out(this.#currentSelected)

    const index = !this.#currentSelected ? 0 : ((this.#currentClickableObjects.findIndex(o => o.mesh === this.#currentSelected) + 1) % this.#currentClickableObjects.length)
    this.#currentSelected = this.#currentClickableObjects[index].mesh

    this.#hover(this.#currentSelected)
  }

  #action() {
    if (!this.#currentSelected) {
      return
    }

    this.#out(this.#currentSelected)

    this.eventList.find(event => event.eventName === 'click' && event.meshName === this.#currentSelected!.name)?.callback(this.#currentSelected)
  }

  #cancel() {

  }

  #out(object3D?: Object3D) {
    if (!object3D) {
      return
    }
    const outEvent = this.eventList.find(outEvent => outEvent.eventName === 'out' && outEvent.meshName === object3D.name)
    outEvent?.callback(object3D)
  }

  #hover(object3D?: Object3D) {
    if (!object3D) {
      return
    }
    const hoverEvent = this.eventList.find(hoverEvent => hoverEvent.eventName === 'hover' && hoverEvent.meshName === object3D.name)
    hoverEvent?.callback(object3D)
  }

  disable(): void {
    super.disable()
    if (this.#controlsData) {
      this.#controlsData.dispose()
      this.#controlsData = undefined
    }
    this.#currentSelected = undefined
  }

  enable(objects3D: Object3D[]) {
    super.enable(objects3D)
    this.#controlsData = attachControls(this.#on)

    this.#currentClickableObjects = []
    for (const group of objects3D) {
      group.traverse(mesh => {
        const event = this.eventList.find(event => event.meshName === mesh.name)
        if (event) {
          this.#currentClickableObjects.push({
            event,
            mesh
          })
        }
      })
    }
    this.#currentClickableObjects.sort((a, b) =>
      this.eventList.findIndex((aEvent) => aEvent.meshName === a.mesh.name) -
      this.eventList.findIndex((bEvent) => bEvent.meshName === b.mesh.name)
    )
  }

  tick() {
    super.tick()
    if (this.#controlsData) {
      this.#controlsData.tick()
    }
  }
}