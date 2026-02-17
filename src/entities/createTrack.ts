import { BufferGeometryUtils } from "three/examples/jsm/Addons.js"
import { loadTrack } from "../render/loadTrack"
import { OBJECT_LAYER_NOT_MOVING, Physic } from "../physic/Physic"
import { BufferGeometry, Material, Mesh, MeshLambertMaterial, RepeatWrapping, TextureLoader } from "three"
import { createTriangleShape } from "../physic/createTriangleShape"
import { MotionType, rigidBody } from "crashcat"
import { quat, vec3 } from "mathcat"

import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { retroizeMaterial, retroizeTexture } from "../helpers/retroize"

export async function createTrack({ physic }: { physic: Physic }) {
  // Track
  const { trackMesh, trackMeshes } = await loadTrack()

  const trackBody = createPhysic({ physic, mesh: trackMesh })
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)
  retroizeTexture(texture)
  trackMesh.material = new MeshLambertMaterial({
    map: texture,
    color: 0xddff99,
    // wireframe: true
  });
  retroizeMaterial(trackMesh.material)
  trackMesh.receiveShadow = true;

  const mountain = trackMeshes.find(mesh => mesh.name === 'mountain')
  if (mountain) {
    const textureLoader = new TextureLoader()
    const texture = await textureLoader.loadAsync(imgSrc)
    // texture.matrix.makeScale(0.0001, 0.0001)
    // texture.matrix.setUvTransform(0, 0, 0.001, 0.001, 0, 0, 0)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(20, 20)

    retroizeTexture(texture);
    // texture.updateMatrix()

    mountain.material = new MeshLambertMaterial({ map: texture, color: 0xddff99 })
  }

  for (const mesh of trackMeshes.filter(m => m.name.indexOf('physic') > -1)) {
    createPhysic({ physic, mesh })
  }

  for (const mesh of trackMeshes) {
    retroizeMaterial(mesh.material as Material)
  }

  return {
    trackBody,
    trackMesh,
    trackMeshes
  }
}

function createPhysic({ physic, mesh }: { physic: Physic, mesh: Mesh }) {
  let trackGeometry = mesh.geometry.clone() as BufferGeometry

  const SIMPLIFY_MESH = true
  if (SIMPLIFY_MESH) {
    console.log(trackGeometry.getAttribute("position").array.length)

    trackGeometry.deleteAttribute('uv')
    trackGeometry.deleteAttribute('normal')
    trackGeometry = BufferGeometryUtils.mergeVertices(trackGeometry, 1);

    console.log(trackGeometry.getAttribute("position").array.length)
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
    // useManifoldReduction: true, // Fix normals ?
  });

  // mesh.position.set(...body.position);
  // mesh.quaternion.set(...body.quaternion);

  return body
}
