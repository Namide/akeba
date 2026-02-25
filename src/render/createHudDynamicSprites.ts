import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

async function create(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d')!;

  const texture = new CanvasTexture(canvas);

  const geometry = new PlaneGeometry(width, height);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const mesh = new Mesh(geometry, material);

  await new FontFace('audiowide', 'url(/assets/audiowide-v22-latin-regular.woff2)').load()

  return {
    mesh,
    context,
    texture
  }
}

export async function createCounter(width: number = 182, height: number = 16) {
  const { mesh, context, texture } = await create(width, height)
  return {
    width,
    height,
    mesh,
    update: (time: number) => {
      const min = Math.floor(time / 60000);
      const sec = Math.floor(time / 1000) % 60
      const ms = Math.floor(time / 10) % 100

      const timeStr = `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}.${ms < 10 ? '0' + ms : ms}`

      context.clearRect(0, 0, width, height);

      context.fillStyle = '#ffffff';
      context.font = 'bold 10px audiowide';
      context.fillText(timeStr, 1, 14);

      // context.fillStyle = 'rgba(255,255,255,0.5)';
      // context.font = '14px audiowide';
      // // context.measureText(`${time}`).width
      // context.fillText('best', 110, 15);

      texture.needsUpdate = true;
    }
  }
}

export async function createVelocity(width: number = 64, height: number = 16) {
  const { mesh, context, texture } = await create(width, height)
  return {
    width,
    height,
    mesh,
    update: (num: number) => {

      context.clearRect(0, 0, width, height);

      // context.fillStyle = '#ff0077';
      // context.beginPath();
      // context.rect(0, 0, width, height);
      // context.fill();

      context.fillStyle = '#ffffff';
      context.font = 'bold 20px audiowide';
      context.fillText(num.toFixed(0), 64 / 2 - num.toFixed(0).length * 10, 14);

      // context.fillStyle = 'rgba(255,255,255,0.5)';
      // context.font = '14px audiowide';
      // // context.measureText(`${time}`).width
      // context.fillText('best', 110, 15);

      texture.needsUpdate = true;
    }
  }
} 