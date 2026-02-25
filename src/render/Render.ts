import {
  AmbientLight,
  CameraHelper,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { resizeRendererToDisplaySize } from './responsiveness';
import { DEBUG, RESOLUTION_HEIGHT } from '../config';
import { createHud } from './createHud';

export type Render = Awaited<ReturnType<typeof createRenderEngine>>

export async function createRenderEngine(canvas: HTMLCanvasElement) {

  const pixelRatio = Math.min(window.devicePixelRatio, 1);

  const renderer = new WebGLRenderer({
    canvas,
    powerPreference: 'high-performance',
    antialias: false,
    alpha: false,
    precision: 'highp',
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.autoClear = false
  renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.fog = new Fog('#8e8ac0', 1, 1000);

  // ===== ⏱️ HUD =====
  const hud = await createHud()

  // ===== 📹 CAMERA =====
  const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 6000);
  camera.position.set(0, 3, 8);

  // ===== 💡 LIGHTS =====
  const ambientLight = new AmbientLight('#BB77FF', .5);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight('#FFF0CA', 1.3);
  directionalLight.castShadow = true;
  directionalLight.shadow.radius = 1;
  directionalLight.shadow.bias = -0.0005;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 1500;
  directionalLight.shadow.camera.left = -500;
  directionalLight.shadow.camera.right = 1000;
  directionalLight.shadow.camera.top = 500;
  directionalLight.shadow.camera.bottom = -300;
  directionalLight.shadow.mapSize.width = 2048 * 2;
  directionalLight.shadow.mapSize.height = 2048 * 2;
  directionalLight.position.set(500, 500, 500);
  scene.add(directionalLight);

  if (DEBUG) {
    const lightHelper = new CameraHelper(directionalLight.shadow.camera)
    scene.add(lightHelper)
  }

  const resize = () => {
    if (resizeRendererToDisplaySize(renderer)) {
      const { clientWidth, clientHeight } = renderer.domElement;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();

      const width = Math.round(RESOLUTION_HEIGHT * clientWidth / clientHeight)
      const height = Math.round(RESOLUTION_HEIGHT)
      hud.resize(width, height);
    }
  }
  window.addEventListener('resize', resize, false);
  resize()

  return {
    scene,
    camera,
    hud,
    renderer,

    render({ withHud }: { withHud: boolean }) {
      renderer.clear();
      renderer.render(scene, camera);
      if (withHud) {
        renderer.clearDepth();
        renderer.render(hud.scene, hud.camera);
      }
    }
  }
}