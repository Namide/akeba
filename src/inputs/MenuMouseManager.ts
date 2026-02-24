import { Object3D, PerspectiveCamera, Raycaster, Vector2 } from "three";

export type MenuEvent = {
  meshName: string,
  eventName: 'click' | 'hover' | 'out',
  callback: (mesh: Object3D) => void
}

export class MenuMouseManager {

  #camera
  protected eventList: MenuEvent[] = []
  #pointer = new Vector2()
  #raycaster = new Raycaster();
  protected objects3D: Object3D[] = []
  #hoverObject: Object3D | undefined

  constructor(camera: PerspectiveCamera) {
    this.#camera = camera
    this.onMove = this.onMove.bind(this)
    this.onClick = this.onClick.bind(this)
  }

  addEvent(
    eventName: MenuEvent['eventName'],
    meshName: string,
    callback: MenuEvent['callback']
  ) {
    this.eventList.push({ eventName, meshName, callback })
  }

  disable() {
    this.objects3D = []
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('click', this.onClick);
  }

  enable(objects3D: Object3D[]) {
    this.disable()
    this.objects3D = objects3D
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('click', this.onClick);
  }

  #getHit() {
    this.#raycaster.setFromCamera(this.#pointer, this.#camera);
    const intersects = this.#raycaster.intersectObjects(this.objects3D, true);
    return intersects[0]
  }

  tick() {
    const lastHover = this.#hoverObject

    let newHover: { object3D: Object3D, callback: MenuEvent['callback'] } | undefined

    const hit = this.#getHit()
    if (hit) {
      for (const event of this.eventList.filter(event => event.eventName === 'hover')) {
        if (event.meshName === hit.object.name) {
          newHover = { object3D: hit.object, callback: event.callback }
        }
      }
    }

    if (newHover && newHover.object3D !== lastHover) {
      newHover.callback(newHover.object3D)
    }

    this.#hoverObject = newHover?.object3D

    if (lastHover && lastHover !== newHover?.object3D) {

      // (this.hoverObject as Mesh<BufferGeometry, MeshLambertMaterial>).material.color.set('#ffffff')

      this.eventList.find(
        event => event.eventName === 'out' && event.meshName === lastHover.name
      )?.callback(lastHover)

      // this.hoverObject = undefined
    }
  }

  private onMove(event: MouseEvent) {
    this.#pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.#pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  private onClick() {
    const hit = this.#getHit()
    if (hit) {
      for (const event of this.eventList.filter(event => event.eventName === 'click')) {
        if (event.meshName === hit.object.name) {
          event.callback(hit.object)
        }
      }
    }
  }
}
