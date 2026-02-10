import { Body, Box, CoefficientFunctionType } from '@perplexdotgg/bounce';
import {
  BoxGeometry,
  BufferGeometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { Physic } from '../physic/Physic';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadSuzanne } from './loadSuzanne';


// we will call this function once the gltf is loaded, since we load suzanne (the monkey) from the gltf
export async function createObjects({ physic }: { physic: Physic }) {
  const suzanneMesh = await loadSuzanne()

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


  // create the ground
  const GROUND_SIZE = 30
  const groundShape = physic.world.createBox({ width: GROUND_SIZE, height: 1, depth: GROUND_SIZE, convexRadius: 0.01 });
  const groundBody = physic.world.createStaticBody({
    shape: groundShape,
    position: { x: 0, y: -0.5, z: 0 },
    restitution: 0.4,
    friction: 0.95,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });
  const groundMesh = new Mesh(new BoxGeometry(GROUND_SIZE, 1, GROUND_SIZE), new MeshLambertMaterial({ color: 0xddff99 }));
  groundMesh.position.set(0, -0.5, 0);
  groundMesh.receiveShadow = true;


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

  return {
    ...createTable({ physic }),
    ...createGround({ physic }),

    suzanneMesh,
    suzanneBody,

    groundMesh,
    groundBody,

    ballMeshes,
    ballBodies,
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
    tableBody
  }
}