import type { WebGLRenderer } from 'three'

let previousWidth = 0;
let previousHeight = 0;

export function resizeRendererToDisplaySize(renderer: WebGLRenderer, pixelRatio: number) {
  const canvas = renderer.domElement;
  const container = canvas.parentElement!;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const needResize = previousWidth !== width || previousHeight !== height;

  const HEIGHT = 320

  if (needResize) {
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderer.setSize(width, height, true);
    renderer.setSize(Math.round(HEIGHT * width / height), Math.round(HEIGHT), false);

    previousWidth = width;
    previousHeight = height;
  }
  return needResize;
}