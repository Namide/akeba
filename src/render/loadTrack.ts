import {
  LoadingManager,
  Mesh,
} from 'three';
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import modelsPath from '../assets/track-01.glb?url';

const assetPath = !!import.meta.env.DEV ? './src/assets/' : './assets/';

export async function loadTrack() {
  const loadingManager = new LoadingManager()

  const gltfLoader = new GLTFLoader(loadingManager);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(assetPath);
  gltfLoader.setDRACOLoader(dracoLoader);

  const gltf = await gltfLoader.loadAsync(modelsPath)

  const trackMeshes = gltf.scene.children.filter(mesh => (mesh as any).isMesh) as Mesh[]
  const trackMesh = gltf.scene.children.find(mesh => mesh.name === 'track') as Mesh
  trackMeshes.splice(trackMeshes.indexOf(trackMesh), 1)

  return { trackMesh, trackMeshes }
}