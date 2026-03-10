import { AdditiveBlending, BufferGeometry, Group, LinearFilter, Mesh, MeshBasicMaterial, MeshLambertMaterial } from "three"
import { MotionType, RigidBody, rigidBody } from "crashcat"
import { quat, vec3 } from "mathcat"
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js"
import { loadTrack } from "../render/loadTrack"
import { OBJECT_LAYER_NOT_MOVING, Physic, PHYSIC_GROUP } from "../physic/Physic"
import { createTriangleShape } from "../physic/createTriangleShape"
import { retroizeMaterial } from "../render/retroize"
import { BACKGROUND_LAYER, MAIN_LAYER, Render } from "../render/Render"
import { fogify } from "../render/fogify"

export async function createTrack({ physic, render }: { physic: Physic, render: Render }) {
  const disposeCallbacks: (() => any)[] = []

  const { trackMesh, trackMeshes, shipMesh, trackLights, controlMeshes, homeMeshes, pauseMeshes, creditsMeshes, outMesh, checkpointMeshes } = await loadTrack()

  const { body: trackBody, dispose: trackDispose } = createPhysic({
    physic,
    mesh: trackMesh,
    collisionGroups: PHYSIC_GROUP.ground,
    collisionMask: PHYSIC_GROUP.player
  })
  disposeCallbacks.push(trackDispose)

  const outData = createPhysic({
    physic,
    mesh: outMesh,
    collisionGroups: PHYSIC_GROUP.item,
    collisionMask: PHYSIC_GROUP.player,
  })
  disposeCallbacks.push(outData.dispose)

  const checkpointBodies: RigidBody[] = []
  for (const checkpointMesh of checkpointMeshes) {
    const checkpointsData = createPhysic({
      physic,
      mesh: checkpointMesh,
      collisionGroups: PHYSIC_GROUP.item,
      collisionMask: PHYSIC_GROUP.player,
    })
    disposeCallbacks.push(checkpointsData.dispose)
    checkpointBodies.push(checkpointsData.body)
  }

  retroizeMaterial(trackMesh.material as MeshLambertMaterial)
  fogify(trackMesh.material as MeshLambertMaterial, render.backgroundRenderTarget.texture)
  trackMesh.receiveShadow = true;
  trackMesh.castShadow = true;

  cleanMenu(controlMeshes)
  cleanMenu(homeMeshes)
  cleanMenu(creditsMeshes)
  cleanMenu(pauseMeshes)

  for (const mesh of trackMeshes.filter(m => m.name.indexOf('physic') > -1)) {
    const data = createPhysic({
      physic,
      mesh,
      collisionGroups: PHYSIC_GROUP.ground,
      collisionMask: PHYSIC_GROUP.player,
    })
    disposeCallbacks.push(data.dispose)
  }

  // Tunel lights
  for (const light of trackLights) {
    light.intensity /= 1360
  }

  // Skybox
  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') !== -1)) {
    const texture = (mesh.material as MeshLambertMaterial).emissiveMap

    mesh.material = new MeshBasicMaterial({
      map: texture,
      depthWrite: false,
      // depthTest: false,
      fog: false
    })
    mesh.layers.set(BACKGROUND_LAYER)

    retroizeMaterial(mesh.material as MeshLambertMaterial)
    // fogify(mesh.material as MeshLambertMaterial, render.backgroundRenderTarget.texture)

    const clone = mesh.clone()
    clone.name = 'clone'
    clone.material = new MeshBasicMaterial({
      map: texture,
      // depthWrite: true,
      // depthTest: false,
      fog: false
    })
    clone.layers.set(MAIN_LAYER)
    retroizeMaterial(clone.material as MeshLambertMaterial)
    trackMeshes.push(clone)
  }

  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('sky') === -1)) {
    retroizeMaterial(mesh.material as MeshLambertMaterial)
    fogify(mesh.material as MeshLambertMaterial, render.backgroundRenderTarget.texture)
    mesh.receiveShadow = true;
    mesh.castShadow = true;
  }

  // Clouds
  for (const mesh of trackMeshes.filter(mesh => mesh.name.indexOf('cloud') > -1)) {
    mesh.material = new MeshBasicMaterial({
      alphaMap: (mesh.material as MeshLambertMaterial).map
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial);
    fogify(mesh.material as MeshLambertMaterial, render.backgroundRenderTarget.texture);

    (mesh.material as MeshLambertMaterial).blending = AdditiveBlending;
    (mesh.material as MeshLambertMaterial).depthWrite = false
  }

  const fogMeshes = trackMeshes.filter(mesh => mesh.name.indexOf('fog') > -1)
  for (const mesh of fogMeshes) {
    mesh.material = new MeshBasicMaterial({
      alphaMap: (mesh.material as MeshLambertMaterial).emissiveMap,
    })
    retroizeMaterial(mesh.material as MeshLambertMaterial);
    fogify(mesh.material as MeshLambertMaterial, render.backgroundRenderTarget.texture);

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
    checkpointBodies,

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
          depthTest: false
        })

        retroizeMaterial(mesh.material as any as MeshLambertMaterial)

        // mesh.material.map!.magFilter = LinearFilter
        mesh.material.map!.minFilter = LinearFilter
        // texture.anisotropy = 0
        // texture.magFilter = NearestFilter
        // texture.minFilter = NearestFilter
      }
    }
  })
}

function createPhysic({ physic, mesh, collisionGroups, collisionMask }: { physic: Physic, mesh: Mesh, collisionGroups: number, collisionMask: number }) {
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

    collisionGroups,
    collisionMask,

    sensor: collisionGroups === PHYSIC_GROUP.item
  });

  return {
    body,
    dispose: () => mesh.geometry.disposeBoundsTree()
  }
}
