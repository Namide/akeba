import { CanvasTexture } from "three";

export function canvasToTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, canvas);
  const texture = new CanvasTexture(canvas);
  return { texture, canvas, ctx };
}