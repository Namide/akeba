import {
  AmbientLight,
  DirectionalLight,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { resizeRendererToDisplaySize } from './responsiveness';

export class Render {
  renderer

  scene
  camera

  pixelRatio = Math.min(window.devicePixelRatio, 1);

  ambientLight
  directionalLight

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
      precision: 'highp',
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 1000);
    this.camera.position.set(0, 3, 8);

    // ===== 💡 LIGHTS =====
    this.ambientLight = new AmbientLight(0xaaccff, .4);
    this.directionalLight = new DirectionalLight(0xffeeaa, 1.3);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.radius = 2;
    this.directionalLight.shadow.bias = 0.0001;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.directionalLight.shadow.mapSize.width = 1024 * 2;
    this.directionalLight.shadow.mapSize.height = 1024 * 2;
    this.directionalLight.position.set(5, 5, 5);
    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);

    this.resize = this.resize.bind(this)
    window.addEventListener('resize', this.resize, false);
  }

  resize() {
    if (resizeRendererToDisplaySize(this.renderer, this.pixelRatio)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}