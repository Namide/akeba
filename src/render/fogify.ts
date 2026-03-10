import { Material, Texture } from "three";

// From: https://medium.com/@anumberfromtheghost/fog-with-dynamic-multicolored-backgrounds-in-three-js-b76907629cb1
export function fogify(
  material = new Material(),
  backgroundTexture = new Texture()
) {

  const uniforms = {
    uBackgroundTexture: { value: backgroundTexture },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBackgroundTexture = uniforms.uBackgroundTexture;

    shader.vertexShader = shader.vertexShader.replace(
      `#include <common>`,
      `#include <common>
   varying vec4 vClipPosition;
   `
    );

    shader.vertexShader = shader.vertexShader.replace(
      `#include <fog_vertex>`,
      `#include <fog_vertex>
   vClipPosition = gl_Position;
   `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <clipping_planes_pars_fragment>`,
      `#include <clipping_planes_pars_fragment>
   uniform sampler2D uBackgroundTexture;
   varying vec4 vClipPosition;
   `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <fog_fragment>`,
      `
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif
        
        // gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
        vec2 vCoords = vClipPosition.xy / vClipPosition.w;
        vCoords = vCoords * 0.5 + 0.5;
        vec3 bgColor = texture2D(uBackgroundTexture, vCoords).rgb;
        gl_FragColor.rgb = mix( gl_FragColor.rgb, bgColor, fogFactor );
      #endif 
      `
    );
  };

  return uniforms;
}