import { BufferGeometryUtils } from "three/examples/jsm/Addons.js"
import { loadTrack } from "../render/loadTrack"
import { OBJECT_LAYER_NOT_MOVING, Physic } from "../physic/Physic"
import { BufferGeometry, MeshLambertMaterial, TextureLoader } from "three"
import { createTriangleShape } from "../physic/createTriangleShape"
import { MotionType, rigidBody } from "crashcat"
import { vec3 } from "mathcat"

import imgSrc from '../assets/uv-checker-map-texture.svg?url'

export async function createTrack({ physic }: { physic: Physic }) {
  // Track
  const trackMesh = await loadTrack()
  let trackGeometry = trackMesh.geometry.clone() as BufferGeometry

  console.log(trackGeometry.getAttribute("position").array.length)

  trackGeometry.deleteAttribute('uv')
  trackGeometry.deleteAttribute('normal')
  trackGeometry = BufferGeometryUtils.mergeVertices(trackGeometry, 1);

  console.log(trackGeometry.getAttribute("position").array.length)

  // cos(45°) ≈ 0.707 → plus permissif
  // cos(30°) ≈ 0.866 → ignore les arêtes dont l'angle entre triangles < 30°
  // cos(10°) ≈ 0.985 → plus strict, seulement les surfaces quasi-plates
  const trackShape = createTriangleShape(trackGeometry, { activeEdgeCosThresholdAngle: 0.866 });
  const trackBody = rigidBody.create(physic.world, {
    shape: trackShape,
    objectLayer: OBJECT_LAYER_NOT_MOVING,
    motionType: MotionType.STATIC,
    position: vec3.fromValues(0, 0, 0),
    restitution: 0,
    friction: 0.5,

    enhancedInternalEdgeRemoval: true,
    useManifoldReduction: true, // Fix normals ?
  });
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(imgSrc)
  trackMesh.material = new MeshLambertMaterial({ map: texture, color: 0xddff99, wireframe: true });
  trackMesh.receiveShadow = true;
  trackMesh.position.set(0, 0, 0);

  trackMesh.position.set(...trackBody.position);
  trackMesh.quaternion.set(...trackBody.quaternion);

  return {
    trackBody,
    trackMesh
  }
}