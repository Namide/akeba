import { CanvasTexture, Color, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

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

function chronoTimeToString(time: number) {
  const min = Math.floor(time / 60000)
  const sec = Math.floor(time / 1000) % 60
  const ms = Math.floor(time / 10) % 100
  return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}.${ms < 10 ? '0' + ms : ms}`
}

export async function createCounter(width: number = 182, height: number = 64) {
  const { mesh, context, texture } = await create(width, height)
  return {
    width,
    height,
    mesh,
    update: (current: number, last: number, best: number) => {

      context.clearRect(0, 0, width, height);

      // Only display best if best is last
      if (best === last) {
        last = 0
      }

      let y = 0
      if (best > 0) {
        y = height - 16

        const bestStr = chronoTimeToString(best)

        context.fillStyle = 'rgba(255,255,255,0.5)';
        context.font = '8px audiowide';
        // context.measureText(`${time}`).width
        context.fillText('BEST', 0, 15 + y);

        context.fillStyle = '#ffff00';
        context.font = '10px audiowide';
        context.fillText(bestStr, 30, 16 + y);
      }

      if (last > 0) {

        if (best > 0) {
          y = height - 28
        } else {
          y = height - 16
        }

        const bestStr = chronoTimeToString(last)

        context.fillStyle = 'rgba(255,255,255,0.5)';
        context.font = '8px audiowide';
        // context.measureText(`${time}`).width
        context.fillText('LAST', 0, 15 + y);

        context.fillStyle = '#ffffff';
        context.font = '10px audiowide';
        context.fillText(bestStr, 30, 16 + y);
      }

      y = height - 14
      if (best > 0) {
        y -= 12
      }
      if (last > 0) {
        y -= 12
      }

      const timeStr = chronoTimeToString(current)

      context.fillStyle = '#ffffff';
      context.font = '16px audiowide';
      context.fillText(timeStr, -1, 14 + y);

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

  const slowColor = new Color('#ffffff')
  const speedColor = new Color('#ffff00')
  const fastColor = new Color('#ff0000')
  const limits = [0, 400, 600]

  const getColor = (speed: number) => {
    if (speed < limits[0]) {
      return slowColor.getHexString()
    }
    if (speed < limits[1]) {
      return slowColor.clone().lerp(speedColor, speed / limits[1]).getHexString()
    }
    if (speed < limits[2]) {
      return speedColor.clone().lerp(fastColor, (speed - limits[1]) / (limits[2] - limits[1])).getHexString()
    }
    return fastColor.getHexString()
  }

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



      context.fillStyle = `#${getColor(num)}`;
      context.font = 'bold 20px audiowide';
      context.fillText(num.toFixed(0), 64 / 2 - num.toFixed(0).length * 10, 16);

      // context.fillStyle = 'rgba(255,255,255,0.5)';
      // context.font = '14px audiowide';
      // // context.measureText(`${time}`).width
      // context.fillText('best', 110, 15);

      texture.needsUpdate = true;
    }
  }
} 