import { BufferGeometry, Vector3 } from "three";
import { triangleMesh } from "crashcat";

export function createTriangleShape(geometry: BufferGeometry, { activeEdgeCosThresholdAngle }: { activeEdgeCosThresholdAngle?: number } = {}) {
  const allPositions: number[] = [];
  const allIndices: number[] = [];

  const positions = geometry.getAttribute('position');

  const vertex = new Vector3();
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    allPositions.push(vertex.x, vertex.y, vertex.z);
  }

  const indices = geometry.getIndex();
  if (indices) {
    for (let i = 0; i < indices.count; i++) {
      allIndices.push(indices.getX(i));
    }
  } else {
    for (let i = 0; i < positions.count; i++) {
      allIndices.push(i);
    }
  }

  return triangleMesh.create({
    positions: allPositions,
    indices: allIndices,
    activeEdgeCosThresholdAngle,
  });
}