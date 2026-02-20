## Todo

- bug: Ghost colision / internal edge collisions - https://box2d.org/posts/2020/06/ghost-collisions/

Solution: Rapier

```js
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

// Ton circuit en TriangleMesh
const vertices = new Float32Array([...]); // positions
const indices = new Uint32Array([...]);   // triangles

const circuitDesc = RAPIER.ColliderDesc
  .trimesh(vertices, indices)
  .setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS);
  // Rapier soude automatiquement les arêtes internes sur les trimesh statiques

world.createCollider(circuitDesc);
```

Solution 2: crashcat

```ts
const circuitShape = world.createTriangleMeshShape({
  positions: [...],
  indices: [...],

  // cos(30°) ≈ 0.866 → ignore les arêtes dont l'angle entre triangles < 30°
  // cos(10°) ≈ 0.985 → plus strict, seulement les surfaces quasi-plates
  // cos(45°) ≈ 0.707 → plus permissif
  activeEdgeCosThresholdAngle: 0.966, // cos(15°), bon point de départ
});
```


// ---


#FFB750
#FF191E



#454545
#FFD22E
#E0007F