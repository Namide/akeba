import { Body, Box, CoefficientFunctionType, TriangleMesh, World } from '@perplexdotgg/bounce';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  LoadingManager,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { DRACOLoader, GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { resizeRendererToDisplaySize } from './helpers/responsiveness.ts';
import modelsPath from './assets/models.glb?url';
import './style.css';

const isDev = !!import.meta.env.DEV;

let canvas: HTMLElement;
let renderer: WebGLRenderer;
let scene: Scene;
let loadingManager: LoadingManager;
let gltfLoader: GLTFLoader;
let ambientLight: AmbientLight;
let directionalLight: DirectionalLight;
let camera: PerspectiveCamera;
let pixelRatio = Math.min(window.devicePixelRatio, 1);
let groundMesh: Mesh;
let groundBody: Body;

const ballMeshes: Mesh[] = [];
// just to make it easier to see rotation
const ballWireframeMeshes: Mesh[] = [];
const ballBodies: Body[] = [];

let tableBody: Body;
let tableMesh: Mesh;

let suzanneShape: TriangleMesh;
let suzanneBody: Body;
let suzanneMesh: Mesh;


const assetPath = isDev ? './src/assets/' : './assets/';

let isLoaded = false;



const physicsWorld = new World();

const ballShape = physicsWorld.createSphere({ radius: 0.11 });
const groundShape = physicsWorld.createBox({ width: 15, height: 1, depth: 15, convexRadius: 0.01 });
const tableTopShape = physicsWorld.createBox({ width: 2, height: 0.2, depth: 1, convexRadius: 0.01 });
const tableLegShape = physicsWorld.createBox({ width: 0.1, height: 0.6, depth: 0.1, convexRadius: 0.01 });
const tableShape = physicsWorld.createCompoundShape([
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

const tempPosition = new Vector3();
const tempRotation = new Quaternion();
const tempScale = new Vector3();
const tempMatrix = new Matrix4();

// we will call this function once the gltf is loaded, since we load suzanne (the monkey) from the gltf
function createBodiesAndMeshes(gltf: GLTF) {
  // create suzanne from the gltf
  gltf.scene.traverse((child) => {
    if (child instanceof Mesh) {
      suzanneMesh = child;
      const suzanneGeo = (child.geometry as BufferGeometry);
      suzanneShape = physicsWorld.createTriangleMesh({
        vertexPositions: suzanneGeo.getAttribute("position").array as Float32Array,
        faceIndices: suzanneGeo.getIndex()!.array as Uint32Array,
      });
    }
  });
  suzanneBody = physicsWorld.createStaticBody({
    shape: suzanneShape,
    position: { x: 0, y: 1.1, z: 0 },
    restitution: 0.2,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });
  suzanneMesh.material = new MeshLambertMaterial({ color: 0xff88aa });
  suzanneMesh.castShadow = true;
  suzanneMesh.position.set(0, 1.1, 0);
  scene.add(suzanneMesh);


  // create the ground
  groundBody = physicsWorld.createStaticBody({
    shape: groundShape,
    position: { x: 0, y: -0.5, z: 0 },
    restitution: 0.4,
    friction: 0.95,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });
  groundMesh = new Mesh(new BoxGeometry(15, 1, 15), new MeshLambertMaterial({ color: 0xddff99 }));
  groundMesh.position.set(0, -0.5, 0);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);


  // create the balls
  for (let i = 0; i < 50; i++) {
    ballBodies.push(physicsWorld.createDynamicBody({
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
    ballWireframeMeshes.push(new Mesh(new SphereGeometry(ballShape.radius * 1.1, 8, 8), new MeshLambertMaterial({ color: 0xffffff, wireframe: true })));
    ballMeshes[i].position.set(-5 + i * 0.5, 5, 0);
    ballWireframeMeshes[i].position.set(-5 + i * 0.5, 5, 0);
    ballMeshes[i].castShadow = true;
    ballWireframeMeshes[i].castShadow = false;
    scene.add(ballMeshes[i]);
    scene.add(ballWireframeMeshes[i]);
  }


  // create the table
  tableBody = physicsWorld.createDynamicBody({
    shape: tableShape,
    position: { x: 1.5, y: 6, z: 0 },
    mass: 10,
    restitution: 0.2,
    friction: 0.9,
    frictionFunction: CoefficientFunctionType.average,
    restitutionFunction: CoefficientFunctionType.average,
  });


  // create a box geometry for each of the table's subshapes (which are all boxes), then merge them together
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
  tableMesh = new Mesh(tableGeo, new MeshLambertMaterial({ color: 0x884422 }));
  tableMesh.position.set(1.5, 6, 0);
  tableMesh.castShadow = true;
  scene.add(tableMesh);
}


function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector('canvas')!;
    renderer = new WebGLRenderer({
      canvas,
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
      precision: 'highp',
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    scene = new Scene();
    camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 3, 8);
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new LoadingManager()

    gltfLoader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( assetPath );
    gltfLoader.setDRACOLoader( dracoLoader );
    gltfLoader.load( modelsPath, (gltf) => {
      createBodiesAndMeshes(gltf);

      isLoaded = true;
    });
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight(0xaaccff, .4);
    directionalLight = new DirectionalLight(0xffeeaa, 1.3);
    directionalLight.castShadow = true;
    directionalLight.shadow.radius = 2;
    directionalLight.shadow.bias = 0.0001;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 1024 * 2;
    directionalLight.shadow.mapSize.height = 1024 * 2;
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);
  }
}

function onResize() {
  if (resizeRendererToDisplaySize(renderer, pixelRatio)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
}

window.addEventListener('resize', onResize, false);

let now: number;
let previousNow: number;
let deltaS: number;

function update() {
  requestAnimationFrame(update);

  now = performance.now();
  if (previousNow === undefined) {
    previousNow = now - 16;
  }

  deltaS = (now - previousNow) / 1000;
  deltaS = Math.min(deltaS, 0.033); // cap deltaS to avoid large time jumps (e.g. when user is in another tab)

  previousNow = now;

  if (!isLoaded) {
    return;
  }

  physicsWorld.takeOneStep(deltaS);

  suzanneMesh.position.set(suzanneBody.position.x, suzanneBody.position.y, suzanneBody.position.z);
  suzanneMesh.quaternion.set(suzanneBody.orientation.x, suzanneBody.orientation.y, suzanneBody.orientation.z, suzanneBody.orientation.w);

  groundMesh.position.set(groundBody.position.x, groundBody.position.y, groundBody.position.z);
  groundMesh.quaternion.set(groundBody.orientation.x, groundBody.orientation.y, groundBody.orientation.z, groundBody.orientation.w);

  for (let i = 0; i < ballBodies.length; i++) {
    const ballBody = ballBodies[i];
    ballMeshes[i].position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);
    ballMeshes[i].quaternion.set(ballBody.orientation.x, ballBody.orientation.y, ballBody.orientation.z, ballBody.orientation.w);

    ballWireframeMeshes[i].position.set(ballBody.position.x, ballBody.position.y, ballBody.position.z);
    ballWireframeMeshes[i].quaternion.set(ballBody.orientation.x, ballBody.orientation.y, ballBody.orientation.z, ballBody.orientation.w);
  }

  tableMesh.position.set(tableBody.position.x, tableBody.position.y, tableBody.position.z);
  tableMesh.quaternion.set(tableBody.orientation.x, tableBody.orientation.y, tableBody.orientation.z, tableBody.orientation.w);

  renderer.render(scene, camera);
}

init();
onResize();
update();