import {
  AmbientLight,
  CameraHelper,
  DirectionalLight,
  Fog,
  NearestFilter,
  PerspectiveCamera,
  RGBFormat,
  Scene,
  SRGBColorSpace,
  UnsignedByteType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { resizeRendererToDisplaySize } from './responsiveness';
import { DEBUG } from '../config';
import { createHud } from './createHud';
import { retroizeTexture } from './retroize';
import { LinearSRGBColorSpace } from 'three';

export type Render = Awaited<ReturnType<typeof createRenderEngine>>

export const MAIN_LAYER = 0;
export const BACKGROUND_LAYER = 1;

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
  renderer.outputColorSpace = LinearSRGBColorSpace
  // renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.fog = new Fog('#ffffff', 1, 1000);

  // ===== 🖼️ BACKGROUND =====
  const backgroundRenderTarget = new WebGLRenderTarget(
    canvas.clientWidth,
    canvas.clientHeight,
    {
      minFilter: NearestFilter,
      magFilter: NearestFilter,

      format: RGBFormat,
      colorSpace: SRGBColorSpace,
      type: UnsignedByteType,
    }
  );
  retroizeTexture(backgroundRenderTarget.texture)

  // ===== ⏱️ HUD =====
  const hud = await createHud()

  // ===== 📹 CAMERA =====
  const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 1, 6000);
  camera.position.set(0, 3, 8);

  // ===== 💡 LIGHTS =====
  const ambientLight = new AmbientLight('#9789c4', 4);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight('#FFF0CA', 2);
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
      const { width, height } = renderer.domElement;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      backgroundRenderTarget.setSize(width, height)

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
    backgroundRenderTarget,

    render({ withHud }: { withHud: boolean }) {

      // Render background
      camera.layers.set(BACKGROUND_LAYER);
      renderer.clear();
      // renderer.outputColorSpace = SRGBColorSpace
      renderer.setRenderTarget(backgroundRenderTarget);
      renderer.render(scene, camera);

      // Render scene
      renderer.clearDepth();
      // renderer.outputColorSpace = SRGBColorSpace
      renderer.setRenderTarget(null);
      camera.layers.set(MAIN_LAYER);

      // renderer.toneMapping = LinearToneMapping
      // renderer.toneMappingExposure = 2.0;

      renderer.render(scene, camera);

      // Render HUD
      if (withHud) {
        renderer.clearDepth();
        renderer.render(hud.scene, hud.camera);
      }
    }
  }
}