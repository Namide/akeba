import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshLambertMaterial,
  RepeatWrapping,
  SphereGeometry,
  TextureLoader,
} from 'three';
import { OBJECT_LAYER_MOVING, OBJECT_LAYER_NOT_MOVING, Physic } from '../physic/Physic';
import { loadSuzanne } from '../render/loadSuzanne';
import { loadTrack } from '../render/loadTrack';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
import { box, MotionQuality, MotionType, rigidBody, sphere } from 'crashcat';
import { createTriangleShape } from '../physic/createTriangleShape';
import { quat, vec3 } from 'mathcat';

const PLANE_GROUND = false


// we will call this function once the gltf is loaded, since we load suzanne (the monkey) from the gltf
export async function createEntities({ physic }: { physic: Physic }) {
  const suzanneMesh = await loadSuzanne()
  const meshes: Mesh[] = []

  const suzanneGeo = (suzanneMesh.geometry as BufferGeometry);
  const suzanneShape = createTriangleShape(suzanneGeo)

  const suzanneBody = rigidBody.create(physic.world, {
    shape: suzanneShape,
    objectLayer: OBJECT_LAYER_NOT_MOVING,
    motionType: MotionType.STATIC,
    position: vec3.fromValues(0, 1.1, 0),
    restitution: 0.2,
    friction: 0.7,
  })
  suzanneMesh.material = new MeshLambertMaterial({ color: 0xff88aa });
  suzanneMesh.castShadow = true;
  suzanneMesh.position.set(0, 1.1, 0);
  meshes.push(suzanneMesh)

  if (PLANE_GROUND) {
    // create the ground
    const GROUND_SIZE = 1000
    const groundShape = box.create({ halfExtents: [GROUND_SIZE / 2, 1 / 2, GROUND_SIZE / 2] });
    const groundBody = rigidBody.create(physic.world, {
      shape: groundShape,
      objectLayer: OBJECT_LAYER_NOT_MOVING,
      motionType: MotionType.STATIC,
      position: vec3.fromValues(0, -0.5, 0),
      restitution: 0.4,
      friction: 0.95,
    });


    const textureLoader = new TextureLoader()
    const texture = await textureLoader.loadAsync(imgSrc)
    // texture.matrix.makeScale(0.0001, 0.0001)
    // texture.matrix.setUvTransform(0, 0, 0.001, 0.001, 0, 0, 0)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(GROUND_SIZE / 100, GROUND_SIZE / 100)
    // texture.updateMatrix()
    const groundMesh = new Mesh(new BoxGeometry(GROUND_SIZE, 1, GROUND_SIZE), new MeshLambertMaterial({ map: texture, color: 0xddff99 }));
    groundMesh.position.set(0, -0.5, 0);
    groundMesh.receiveShadow = true;

    groundMesh.position.set(...groundBody.position);
    groundMesh.quaternion.set(...groundBody.quaternion);

    meshes.push(groundMesh)
  } else {

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
      friction: 0.95,

      enhancedInternalEdgeRemoval: true,
      // useManifoldReduction: true,
    });
    const textureLoader = new TextureLoader()
    const texture = await textureLoader.loadAsync(imgSrc)
    trackMesh.material = new MeshLambertMaterial({ map: texture, color: 0xddff99 });
    trackMesh.receiveShadow = true;
    trackMesh.position.set(0, 0, 0);

    trackMesh.position.set(...trackBody.position);
    trackMesh.quaternion.set(...trackBody.quaternion);


    meshes.push(trackMesh)
  }



  // create the balls
  const ballMeshes: Mesh[] = [];
  const ballBodies: rigidBody.RigidBody[] = [];
  const ballShape = sphere.create({
    radius: 0.11,
  });
  for (let i = 0; i < 50; i++) {
    const ballBody = rigidBody.create(physic.world, {
      shape: ballShape,

      objectLayer: OBJECT_LAYER_MOVING,
      motionType: MotionType.DYNAMIC,
      motionQuality: MotionQuality.DISCRETE,

      position: vec3.fromValues(-5 + i * 0.2, 3 + Math.random() * 5, .5 - Math.random()),
      quaternion: quat.create(),

      restitution: 0.6,
      friction: 0.8,
      mass: 0.45
    });
    rigidBody.setLinearVelocity(physic.world, ballBody, [1 - Math.random(), 3 * Math.random(), 0]);
    ballBodies.push(ballBody)

    ballMeshes.push(new Mesh(new SphereGeometry(ballShape.radius, 32, 32), new MeshLambertMaterial({ color: 0x8888ff })));
    ballMeshes[i].position.set(-5 + i * 0.5, 5, 0);
    ballMeshes[i].castShadow = true;
  }
  meshes.push(...ballMeshes)

  const { bumpsMeshes, bumpsBodies } = createGround({ physic })
  meshes.push(...bumpsMeshes)


  return {
    meshes,
    tick: () => {
      suzanneMesh.position.set(...suzanneBody.position);
      suzanneMesh.quaternion.set(...suzanneBody.quaternion);

      // groundMesh.position.set(groundBody.position.x, groundBody.position.y, groundBody.position.z);
      // groundMesh.quaternion.set(groundBody.orientation.x, groundBody.orientation.y, groundBody.orientation.z, groundBody.orientation.w);


      // trackMesh.position.set(trackBody.position.x, trackBody.position.y, trackBody.position.z);
      // trackMesh.quaternion.set(trackBody.orientation.x, trackBody.orientation.y, trackBody.orientation.z, trackBody.orientation.w);

      for (let i = 0; i < ballBodies.length; i++) {
        const ballBody = ballBodies[i];
        ballMeshes[i].position.set(...ballBody.position);
        ballMeshes[i].quaternion.set(...ballBody.quaternion);
      }

      for (let i = 0; i < bumpsBodies.length; i++) {
        const bumpsBody = bumpsBodies[i];
        bumpsMeshes[i].position.set(...bumpsBody.position);
        bumpsMeshes[i].quaternion.set(...bumpsBody.quaternion);
      }
    }
  }
}

function createGround({ physic }: { physic: Physic }) {
  // create the balls
  const bumpsMeshes: Mesh[] = [];
  const bumpsBodies: rigidBody.RigidBody[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = 0.5 + Math.random()
    const x = Math.random() * 20 - 10
    const z = Math.random() * 20 - 10

    const bumpsShape = sphere.create({ radius });
    bumpsBodies.push(rigidBody.create(physic.world, {
      shape: bumpsShape,
      motionType: MotionType.STATIC,
      objectLayer: OBJECT_LAYER_NOT_MOVING,
      position: vec3.fromValues(x, - radius / 2, z),
      restitution: 0.4,
      friction: 0.95,
    }));

    bumpsMeshes.push(new Mesh(new SphereGeometry(bumpsShape.radius, 32, 32), new MeshLambertMaterial({ color: 0x8888ff })));
    bumpsMeshes[i].position.set(-5 + i * 0.5, 5, 0);
    bumpsMeshes[i].castShadow = true;
  }

  return {
    bumpsBodies,
    bumpsMeshes
  }
}

// function createTable({ physic }: { physic: Physic }) {

//   const tableTopShape = box.create({ halfExtents: [1, 0.1, 1] });
//   const tableLegShape = physic.world.createBox({ width: 0.1, height: 0.6, depth: 0.1, convexRadius: 0.01 });
//   const tableShape = physic.world.createCompoundShape([
//     {
//       shape: tableTopShape,
//       transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
//     },
//     {
//       shape: tableLegShape,
//       transform: { position: { x: 0 - tableTopShape.width / 2 + tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 - tableTopShape.depth / 2 + tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
//     },
//     {
//       shape: tableLegShape,
//       transform: { position: { x: 0 + tableTopShape.width / 2 - tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 - tableTopShape.depth / 2 + tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
//     },
//     {
//       shape: tableLegShape,
//       transform: { position: { x: 0 - tableTopShape.width / 2 + tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 + tableTopShape.depth / 2 - tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
//     },
//     {
//       shape: tableLegShape,
//       transform: { position: { x: 0 + tableTopShape.width / 2 - tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 + tableTopShape.depth / 2 - tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
//     },
//   ]);


//   const tableBody = physic.world.createDynamicBody({
//     shape: tableShape,
//     position: { x: 1.5, y: 6, z: 0 },
//     mass: 10,
//     restitution: 0.2,
//     friction: 0.9,
//     frictionFunction: CoefficientFunctionType.average,
//     restitutionFunction: CoefficientFunctionType.average,
//   });

//   // create a box geometry for each of the table's subshapes (which are all boxes), then merge them together
//   const tempPosition = new Vector3();
//   const tempRotation = new Quaternion();
//   const tempScale = new Vector3();
//   const tempMatrix = new Matrix4();
//   const geometries: BufferGeometry[] = [];
//   tableShape.walkShapes((shape, shapeTransform) => {
//     const boxShape = shape as Box;
//     const geometry = new BoxGeometry(boxShape.width, boxShape.height, boxShape.depth).toNonIndexed();
//     geometry.deleteAttribute("uv");

//     tempPosition.copy(shapeTransform.position);
//     tempRotation.copy(shapeTransform.rotation);
//     tempScale.setScalar(shapeTransform.scale);
//     tempMatrix.compose(tempPosition, tempRotation, tempScale);

//     geometry.applyMatrix4(tempMatrix);
//     geometries.push(geometry);
//   });
//   const tableGeo = mergeGeometries(geometries, true);
//   const tableMesh = new Mesh(tableGeo, new MeshLambertMaterial({ color: 0x884422 }));
//   tableMesh.position.set(1.5, 6, 0);
//   tableMesh.castShadow = true;

//   return {
//     tableMesh,
//     tableBody,
//   }
// }