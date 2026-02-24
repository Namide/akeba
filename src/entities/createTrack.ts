import { AdditiveBlending, BufferGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial } from "three"
import { MotionType, rigidBody } from "crashcat"
import { quat, vec3 } from "mathcat"
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js"
import { loadTrack } from "../render/loadTrack"
import { OBJECT_LAYER_NOT_MOVING, Physic } from "../physic/Physic"
import { createTriangleShape } from "../physic/createTriangleShape"
import { retroizeMaterial } from "../render/retroize"

export async function createTrack({ physic }: { physic: Physic }) {
  const disposeCallbacks: (() => any)[] = []

  const { trackMesh, trackMeshes, shipMesh, trackLights, controlMeshes, homeMeshes, pauseMeshes, creditsMeshes, outMesh } = await loadTrack()

  const { body: trackBody, dispose: trackDispose } = createPhysic({ physic, mesh: trackMesh })
  disposeCallbacks.push(trackDispose)

  const outData = createPhysic({ physic, mesh: outMesh })
  disposeCallbacks.push(outData.dispose)

  retroizeMaterial(trackMesh.material as MeshLambertMaterial)
  trackMesh.receiveShadow = true;
  trackMesh.castShadow = true;

  cleanMenu(controlMeshes)
  cleanMenu(homeMeshes)
  cleanMenu(creditsMeshes)
  cleanMenu(pauseMeshes)

  for (const mesh of trackMeshes.filter(m => m.name.indexOf('physic') > -1)) {
    const data = createPhysic({ physic, mesh })
    disposeCallbacks.push(data.dispose)
  }

  // Tunel lights
  for (const light of trackLights) {
    light.intensity /= 1360
  }

  // Skybox
  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') !== -1)) {
    mesh.material = new MeshBasicMaterial({
      map: (mesh.material as MeshLambertMaterial).emissiveMap
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial)
  }

  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') === -1)) {
    retroizeMaterial(mesh.material as MeshLambertMaterial)
    mesh.receiveShadow = true;
    mesh.castShadow = true;
  }

  // Clouds
  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('cloud') > -1)) {
    mesh.material = new MeshBasicMaterial({
      alphaMap: (mesh.material as MeshLambertMaterial).map
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial);

    (mesh.material as MeshLambertMaterial).blending = AdditiveBlending;
    (mesh.material as MeshLambertMaterial).depthWrite = false
  }

  const fogMeshes = trackMeshes.filter(mesh => mesh.name.indexOf('fog') > -1)
  for (const mesh of fogMeshes) {
    mesh.material = new MeshBasicMaterial({
      alphaMap: (mesh.material as MeshLambertMaterial).emissiveMap,
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial);

    (mesh.material as MeshLambertMaterial).blending = AdditiveBlending;
    (mesh.material as MeshLambertMaterial).depthWrite = false;
    mesh.userData = { velocity: Math.random() * 0.3 + 0.3 }
  }

  return {
    trackBody,
    trackMesh,
    trackMeshes,
    trackLights,
    fogMeshes,
    shipMesh,

    outBody: outData.body,

    controlMeshes,
    homeMeshes,
    creditsMeshes,
    pauseMeshes,

    trackDispose: () => {
      for (const cb of disposeCallbacks) {
        cb()
      }
    }
  }
}

function cleanMenu(group: Group) {
  group.traverse((object) => {
    if ((object as Mesh).isMesh) {

      const mesh = object as Mesh<BufferGeometry, MeshLambertMaterial | MeshBasicMaterial>

      if (mesh.name.indexOf('wireframe') > -1) {

        mesh.material = new MeshBasicMaterial({
          wireframe: true,
          color: '#ffffff'
        })
      } else {

        const texture = (mesh.material as MeshLambertMaterial).emissiveMap!

        mesh.material = new MeshBasicMaterial({
          map: texture,
          transparent: true,
        })

        retroizeMaterial(mesh.material as any as MeshLambertMaterial)
      }
    }
  })
}

function createPhysic({ physic, mesh }: { physic: Physic, mesh: Mesh }) {
  let trackGeometry = mesh.geometry.clone() as BufferGeometry

  // Perf: x10 https://www.npmjs.com/package/three-mesh-bvh
  mesh.geometry.computeBoundsTree()

  const SIMPLIFY_MESH = true
  if (SIMPLIFY_MESH) {
    trackGeometry.deleteAttribute('uv')
    trackGeometry.deleteAttribute('normal')
    trackGeometry = BufferGeometryUtils.mergeVertices(trackGeometry, 1);
  }

  // cos(45°) ≈ 0.707 → plus permissif
  // cos(30°) ≈ 0.866 → ignore les arêtes dont l'angle entre triangles < 30°
  // cos(10°) ≈ 0.985 → plus strict, seulement les surfaces quasi-plates
  const trackShape = createTriangleShape(trackGeometry, { activeEdgeCosThresholdAngle: 0.707 });
  const body = rigidBody.create(physic.world, {
    shape: trackShape,
    objectLayer: OBJECT_LAYER_NOT_MOVING,
    motionType: MotionType.STATIC,
    position: vec3.fromValues(...mesh.position.toArray()),
    quaternion: quat.fromValues(...mesh.quaternion.toArray()),
    restitution: 0,
    friction: 0.5,

    enhancedInternalEdgeRemoval: true,
  });

  return {
    body,
    dispose: () => mesh.geometry.computeBoundsTree()
  }
}
