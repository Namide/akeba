import {
  LoadingManager,
  Mesh,
} from 'three';
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import modelsPath from '../assets/models.glb?url';

const assetPath = !!import.meta.env.DEV ? './src/assets/' : './assets/';

export async function loadSuzanne() {
  const loadingManager = new LoadingManager()

  const gltfLoader = new GLTFLoader(loadingManager);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(assetPath);
  gltfLoader.setDRACOLoader(dracoLoader);

  const gltf = await gltfLoader.loadAsync(modelsPath)
  const suzanneMesh = await new Promise<Mesh>(resolve => {
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        resolve(child);
      }
    });
  })

  return suzanneMesh
}