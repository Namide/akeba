import { Group, Light, LoadingManager, Mesh } from 'three';
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

  const groups = gltf.scene.children[0].children[0]

  const gameMeshes = groups.children.find(group => group.name === 'game')!.children

  const controlMeshes = new Group()
  controlMeshes.add(...groups.children.find(group => group.name === 'control-screen')!.children)

  const homeMeshes = new Group()
  homeMeshes.add(...groups.children.find(group => group.name === 'home-screen')!.children)

  const pauseMeshes = new Group()
  pauseMeshes.add(...groups.children.find(group => group.name === 'pause-screen')!.children)

  const creditsMeshes = new Group()
  creditsMeshes.add(...groups.children.find(group => group.name === 'credits-screen')!.children)

  const trackMeshes = gameMeshes.filter(mesh => (mesh as any).isMesh) as Mesh[]
  const trackLights = gameMeshes.filter(mesh => (mesh as any).isLight) as Light[]

  const trackMesh = trackMeshes.find(mesh => mesh.name === 'track') as Mesh
  trackMeshes.splice(trackMeshes.indexOf(trackMesh), 1)

  const shipMesh = trackMeshes.find(mesh => mesh.name === 'ship-01') as Mesh
  trackMeshes.splice(trackMeshes.indexOf(shipMesh), 1)

  const outMesh = trackMeshes.find(mesh => mesh.name === 'out-hidden') as Mesh
  trackMeshes.splice(trackMeshes.indexOf(outMesh), 1)

  return { trackMesh, trackMeshes, shipMesh, trackLights, controlMeshes, homeMeshes, pauseMeshes, creditsMeshes, outMesh }
}