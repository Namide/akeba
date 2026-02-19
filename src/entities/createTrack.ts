import { loadTrack } from "../render/loadTrack"
import { AdditiveBlending, MeshBasicMaterial, MeshLambertMaterial } from "three"
import { retroizeMaterial } from "../render/retroize"

export async function createTrack() {
  // Track
  const { trackMesh, trackMeshes, shipMesh, trackLights } = await loadTrack()

  // const trackBody = createPhysic({ physic, mesh: trackMesh })
  // const textureLoader = new TextureLoader()
  // const texture = await textureLoader.loadAsync(imgSrc)
  // retroizeTexture(texture)
  // trackMesh.material = new MeshLambertMaterial({
  //   map: texture,
  //   color: 0xddff99,
  //   // wireframe: true
  // });
  retroizeMaterial(trackMesh.material as MeshLambertMaterial)
  trackMesh.receiveShadow = true;
  trackMesh.castShadow = true;

  const mountain = trackMeshes.find(mesh => mesh.name === 'mountain')
  if (mountain) {
    // const textureLoader = new TextureLoader()
    // const texture = await textureLoader.loadAsync(imgSrc)
    // texture.wrapS = RepeatWrapping
    // texture.wrapT = RepeatWrapping
    // texture.repeat.set(20, 20)
    // retroizeTexture(texture);
    // mountain.material = new MeshLambertMaterial({ map: texture, color: 0xddff99 })
  }

  for (const mesh of trackMeshes.filter(m => m.name.indexOf('physic') > -1)) {
    // Perf: x10 https://www.npmjs.com/package/three-mesh-bvh
    mesh.geometry.computeBoundsTree()
  }

  // Tunel lights
  for (const light of trackLights) {
    light.intensity = 200
  }

  // Skybox
  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') !== -1)) {
    mesh.material = new MeshBasicMaterial({
      map: (mesh.material as MeshLambertMaterial).map
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial)
  }

  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') === -1)) {
    retroizeMaterial(mesh.material as MeshLambertMaterial)
    mesh.receiveShadow = true;
    mesh.castShadow = true;
  }

  // Clouds
  for (const { material } of trackMeshes.filter(m => m.name.indexOf('cloud') > -1)) {
    (material as MeshLambertMaterial).blending = AdditiveBlending;
    (material as MeshLambertMaterial).depthWrite = false
  }

  return {
    // trackBody,
    trackMesh,
    trackMeshes,
    trackLights,
    shipMesh
  }
}
