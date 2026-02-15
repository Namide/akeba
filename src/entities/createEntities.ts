import { Body, Box, CoefficientFunctionType } from '@perplexdotgg/bounce';
import {
  BoxGeometry,
  BufferGeometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadSuzanne } from '../render/loadSuzanne';
import { loadTrack } from '../render/loadTrack';
import imgSrc from '../assets/uv-checker-map-texture.svg?url'
import { physicGroupFlags } from '../physic/physicGroupFlags';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

const PLANE_GROUND = false


// we will call this function once the gltf is loaded, since we load suzanne (the monkey) from the gltf
export async function createEntities({ physic }: { physic: Physic }) {
  const suzanneMesh = await loadSuzanne()
  const meshes: Mesh[] = []

  const suzanneGeo = (suzanneMesh.geometry as BufferGeometry);
  const suzanneShape = physic.world.createTriangleMesh({
    vertexPositions: suzanneGeo.getAttribute("position").array as Float32Array,
    faceIndices: suzanneGeo.getIndex()!.array as Uint32Array,
  });

  const suzanneBody = physic.world.createStaticBody({
    shape: suzanneShape,
    position: { x: 0, y: 1.1, z: 0 },
    restitution: 0.2,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });
  suzanneMesh.material = new MeshLambertMaterial({ color: 0xff88aa });
  suzanneMesh.castShadow = true;
  suzanneMesh.position.set(0, 1.1, 0);
  meshes.push(suzanneMesh)

  if (PLANE_GROUND) {
    // create the ground
    const GROUND_SIZE = 1000
    const groundShape = physic.world.createBox({ width: GROUND_SIZE, height: 1, depth: GROUND_SIZE, convexRadius: 0.01 });
    const groundBody = physic.world.createStaticBody({
      shape: groundShape,
      position: { x: 0, y: -0.5, z: 0 },
      restitution: 0.4,
      friction: 0.95,
      frictionFunction: CoefficientFunctionType.average,
      restitutionFunction: CoefficientFunctionType.average,
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

    groundMesh.position.set(groundBody.position.x, groundBody.position.y, groundBody.position.z);
    groundMesh.quaternion.set(groundBody.orientation.x, groundBody.orientation.y, groundBody.orientation.z, groundBody.orientation.w);

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

    const trackShape = physic.world.createTriangleMesh({
      vertexPositions: trackGeometry.getAttribute("position").array as Float32Array,
      faceIndices: trackGeometry.getIndex()!.array as Uint32Array,

      // https://codeberg.org/perplexdotgg/bounce/src/branch/main/docs/documentation.md#triangle-mesh
      forceCreateConvexHull: false,


    });
    const trackBody = physic.world.createStaticBody({
      shape: trackShape,
      position: { x: 0, y: 0, z: 0 },
      belongsToGroups: physicGroupFlags.Ground,

      restitution: 0, // Bounce
      friction: 0.95,
      frictionFunction: CoefficientFunctionType.average,
      restitutionFunction: CoefficientFunctionType.average,
    });
    const textureLoader = new TextureLoader()
    const texture = await textureLoader.loadAsync(imgSrc)
    trackMesh.material = new MeshLambertMaterial({ map: texture, color: 0xddff99 });
    trackMesh.receiveShadow = true;
    trackMesh.position.set(0, 0, 0);

    trackMesh.position.set(trackBody.position.x, trackBody.position.y, trackBody.position.z);
    trackMesh.quaternion.set(trackBody.orientation.x, trackBody.orientation.y, trackBody.orientation.z, trackBody.orientation.w);


    meshes.push(trackMesh)
  }



  // create the balls
  const ballMeshes: Mesh[] = [];
  const ballBodies: Body[] = [];
  const ballShape = physic.world.createSphere({ radius: 0.11 });
  for (let i = 0; i < 50; i++) {
    ballBodies.push(physic.world.createDynamicBody({
      shape: ballShape,
      position: { x: -5 + i * 0.2, y: 3 + Math.random() * 5, z: .5 - Math.random() },
      linearVelocity: { x: 1 - Math.random(), y: 3 * Math.random(), z: 0 },
      mass: .45,
      restitution: 0.6,
      friction: 0.8,
      frictionFunction: CoefficientFunctionType.average,
      restitutionFunction: CoefficientFunctionType.average,
    }));

    ballMeshes.push(new Mesh(new SphereGeometry(ballShape.radius, 32, 32), new MeshLambertMaterial({ color: 0x8888ff })));
    ballMeshes[i].position.set(-5 + i * 0.5, 5, 0);
    ballMeshes[i].castShadow = true;
  }
  meshes.push(...ballMeshes)

  const { tableMesh, tableBody } = createTable({ physic })
  meshes.push(tableMesh)
  const { bumpsMeshes, bumpsBodies } = createGround({ physic })
  meshes.push(...bumpsMeshes)


  return {
    meshes,
    tick: () => {
      suzanneMesh.position.set(suzanneBody.position.x, suzanneBody.position.y, suzanneBody.position.z);
      suzanneMesh.quaternion.set(suzanneBody.orientation.x, suzanneBody.orientation.y, suzanneBody.orientation.z, suzanneBody.orientation.w);

      // groundMesh.position.set(groundBody.position.x, groundBody.position.y, groundBody.position.z);
      // groundMesh.quaternion.set(groundBody.orientation.x, groundBody.orientation.y, groundBody.orientation.z, groundBody.orientation.w);


      // trackMesh.position.set(trackBody.position.x, trackBody.position.y, trackBody.position.z);
      // trackMesh.quaternion.set(trackBody.orientation.x, trackBody.orientation.y, trackBody.orientation.z, trackBody.orientation.w);

      for (let i = 0; i < ballBodies.length; i++) {
        const ballBody = ballBodies[i];
        ballMeshes[i].position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);
        ballMeshes[i].quaternion.set(ballBody.orientation.x, ballBody.orientation.y, ballBody.orientation.z, ballBody.orientation.w);
      }

      for (let i = 0; i < bumpsBodies.length; i++) {
        const bumpsBody = bumpsBodies[i];
        bumpsMeshes[i].position.set(bumpsBody.position.x, bumpsBody.position.y, bumpsBody.position.z);
        bumpsMeshes[i].quaternion.set(bumpsBody.orientation.x, bumpsBody.orientation.y, bumpsBody.orientation.z, bumpsBody.orientation.w);
      }

      tableMesh.position.set(tableBody.position.x, tableBody.position.y, tableBody.position.z);
      tableMesh.quaternion.set(tableBody.orientation.x, tableBody.orientation.y, tableBody.orientation.z, tableBody.orientation.w);
    }
  }
}

function createGround({ physic }: { physic: Physic }) {
  // create the balls
  const bumpsMeshes: Mesh[] = [];
  const bumpsBodies: Body[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = 0.5 + Math.random()
    const x = Math.random() * 20 - 10
    const z = Math.random() * 20 - 10

    const bumpsShape = physic.world.createSphere({ radius });
    bumpsBodies.push(physic.world.createStaticBody({
      shape: bumpsShape,
      position: { x, y: - radius / 2, z },
      restitution: 0.4,
      friction: 0.95,
      frictionFunction: CoefficientFunctionType.average,
      restitutionFunction: CoefficientFunctionType.average,
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

function createTable({ physic }: { physic: Physic }) {

  const tableTopShape = physic.world.createBox({ width: 2, height: 0.2, depth: 1, convexRadius: 0.01 });
  const tableLegShape = physic.world.createBox({ width: 0.1, height: 0.6, depth: 0.1, convexRadius: 0.01 });
  const tableShape = physic.world.createCompoundShape([
    {
      shape: tableTopShape,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    },
    {
      shape: tableLegShape,
      transform: { position: { x: 0 - tableTopShape.width / 2 + tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 - tableTopShape.depth / 2 + tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
    },
    {
      shape: tableLegShape,
      transform: { position: { x: 0 + tableTopShape.width / 2 - tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 - tableTopShape.depth / 2 + tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
    },
    {
      shape: tableLegShape,
      transform: { position: { x: 0 - tableTopShape.width / 2 + tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 + tableTopShape.depth / 2 - tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
    },
    {
      shape: tableLegShape,
      transform: { position: { x: 0 + tableTopShape.width / 2 - tableLegShape.width / 2, y: -tableTopShape.height / 2 - tableLegShape.height / 2, z: 0 + tableTopShape.depth / 2 - tableLegShape.depth / 2 }, rotation: { x: 0, y: 0, z: 0 } },
    },
  ]);


  const tableBody = physic.world.createDynamicBody({
    shape: tableShape,
    position: { x: 1.5, y: 6, z: 0 },
    mass: 10,
    restitution: 0.2,
    friction: 0.9,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });

  // create a box geometry for each of the table's subshapes (which are all boxes), then merge them together
  const tempPosition = new Vector3();
  const tempRotation = new Quaternion();
  const tempScale = new Vector3();
  const tempMatrix = new Matrix4();
  const geometries: BufferGeometry[] = [];
  tableShape.walkShapes((shape, shapeTransform) => {
    const boxShape = shape as Box;
    const geometry = new BoxGeometry(boxShape.width, boxShape.height, boxShape.depth).toNonIndexed();
    geometry.deleteAttribute("uv");

    tempPosition.copy(shapeTransform.position);
    tempRotation.copy(shapeTransform.rotation);
    tempScale.setScalar(shapeTransform.scale);
    tempMatrix.compose(tempPosition, tempRotation, tempScale);

    geometry.applyMatrix4(tempMatrix);
    geometries.push(geometry);
  });
  const tableGeo = mergeGeometries(geometries, true);
  const tableMesh = new Mesh(tableGeo, new MeshLambertMaterial({ color: 0x884422 }));
  tableMesh.position.set(1.5, 6, 0);
  tableMesh.castShadow = true;

  return {
    tableMesh,
    tableBody,
  }
}