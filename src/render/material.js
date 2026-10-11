// The eBoy shader: flat three-tone shading picked by which way a face points
// on screen (top light, left mid, right dark), so lighting stays consistent as
// the camera rotates. Global uniforms drive day/night, doom tint and the
// ending palettes; every voxel material shares them.

import * as THREE from 'three';

// Pixel art wants exact palette values: no linear/sRGB conversions anywhere.
THREE.ColorManagement.enabled = false;

export const U = {
  uDay: { value: 1 },
  uDoom: { value: 0 },
  uClip: { value: 0 },
  uWinter: { value: 0 },
  uUtopia: { value: 0 },
  uTime: { value: 0 },
  uRight: { value: new THREE.Vector3(1, 0, -1).normalize() },
  uShadeL: { value: 0.84 },
  uShadeR: { value: 0.66 },
  uGlass: { value: new THREE.Color(0x8ed3ff) },
  uNight: { value: new THREE.Color(0x3a4a8c) },
  uFlash: { value: 0 },
};

const vertex = /* glsl */ `
attribute vec3 aColor;
attribute float aEmit;
attribute float aTint;
#ifdef USE_IC2
attribute vec3 iColor2;
#endif
uniform vec3 uRight;
uniform float uShadeL;
uniform float uShadeR;
varying vec3 vColor;
varying float vEmit;
varying float vShade;
varying float vTop;
varying vec3 vWorld;
void main() {
  vec3 col = aColor;
  #ifdef USE_INSTANCING_COLOR
  if (aTint > 0.5 && aTint < 1.5) col = instanceColor;
  #endif
  #ifdef USE_IC2
  if (aTint > 1.5) col = iColor2;
  #endif
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * p;
  n = normalize(mat3(modelMatrix) * n);
  float shade = n.y > 0.5 ? 1.0 : (n.y < -0.5 ? 0.45 : (dot(n, uRight) > 0.0 ? uShadeR : uShadeL));
  vShade = shade;
  vTop = step(0.5, n.y);
  vColor = col;
  vEmit = aEmit;
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragment = /* glsl */ `
uniform float uDay;
uniform float uDoom;
uniform float uClip;
uniform float uWinter;
uniform float uUtopia;
uniform float uTime;
uniform float uFlash;
uniform vec3 uGlass;
uniform vec3 uNight;
varying vec3 vColor;
varying float vEmit;
varying float vShade;
varying float vTop;
varying vec3 vWorld;

float luma(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }

void main() {
  vec3 c = vColor * vShade;
  vec3 night = c * uNight * 1.25;
  vec3 lit = mix(night, c, uDay);
  if (vEmit > 0.5 && vEmit < 1.5) {
    // Windows: sky-blue glass by day, their own color glowing at night.
    vec3 glass = uGlass * vShade;
    bool off = luma(vColor) < 0.35;
    vec3 glow = off ? vColor * 0.9 : vColor * 1.08;
    lit = mix(glow, glass, uDay);
  } else if (vEmit > 1.5 && vEmit < 2.5) {
    lit = vColor * mix(1.12, 0.92 + 0.08 * vShade, uDay);
  } else if (vEmit > 2.5) {
    // Blinking LEDs: each voxel cell flickers on its own clock.
    float h = fract(sin(dot(floor(vWorld * 16.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float on = step(0.45, fract(h * 7.0 + uTime * (0.5 + h)));
    lit = mix(vColor * 0.3, vColor * 1.2, on);
  }
  // Doom: the whole palette slides toward a sick orange.
  float d = uDoom * uDoom;
  lit = mix(lit, lit * vec3(1.18, 0.78, 0.62) + vec3(0.04, 0.0, 0.0), d * 0.55);
  // Ending palettes.
  float l = luma(lit);
  lit = mix(lit, vec3(l) * vec3(0.86, 0.9, 1.0) * 1.15 + 0.05, uClip);
  vec3 snow = mix(vec3(l) * vec3(0.78, 0.88, 1.12) + 0.14, vec3(0.94, 0.97, 1.0), vTop * 0.85);
  lit = mix(lit, snow, uWinter);
  lit = mix(lit, lit * 1.12 + vec3(0.07, 0.05, 0.0), uUtopia);
  lit = mix(lit, vec3(1.0), uFlash);
  gl_FragColor = vec4(lit, 1.0);
}
`;

export function voxelMaterial({ ic2 = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: vertex,
    fragmentShader: fragment,
    defines: ic2 ? { USE_IC2: '' } : {},
  });
}

// Water: deep blue with drifting foam glints, quantized so it reads as pixels.
export function waterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uDay;
      uniform float uDoom;
      uniform float uClip;
      uniform float uWinter;
      uniform float uUtopia;
      uniform vec3 uNight;
      varying vec3 vWorld;
      void main() {
        // Broad, slow color swells.
        vec2 p = floor(vWorld.xz * 6.0) / 6.0;
        float w = sin(p.x * 0.35 + uTime * 0.25 + sin(p.y * 0.3 + uTime * 0.15) * 2.0)
                * sin(p.y * 0.42 - uTime * 0.2);
        vec3 deep = vec3(0.16, 0.53, 0.92);
        vec3 shallow = vec3(0.24, 0.62, 0.97);
        vec3 c = mix(deep, shallow, step(0.3, w));
        // Sparse glints: short horizontal dashes that blink on and off.
        vec2 cell = floor(vWorld.xz * 1.6);
        float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
        vec2 f = fract(vWorld.xz * 1.6);
        float on = step(fract(h * 13.0 + uTime * (0.12 + h * 0.1)), 0.18);
        float dash = step(0.25, f.x) * step(f.x, 0.25 + 0.2 + h * 0.25) * step(0.48, f.y) * step(f.y, 0.56);
        c = mix(c, vec3(0.82, 0.95, 1.0), on * dash);
        vec3 n = c * uNight * 1.3;
        c = mix(n, c, uDay);
        float d = uDoom * uDoom;
        c = mix(c, c * vec3(1.25, 0.6, 0.55) + vec3(0.08, 0.0, 0.0), d * 0.6);
        float l = dot(c, vec3(0.3, 0.59, 0.11));
        c = mix(c, vec3(l) * vec3(0.85, 0.9, 1.0) * 1.1, uClip);
        c = mix(c, vec3(0.75, 0.88, 1.0), uWinter * 0.8);
        c = mix(c, c * 1.1 + vec3(0.0, 0.05, 0.05), uUtopia);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

// Pixel-text signs: a canvas texture that ignores lighting (signs are lit).
export function signMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, map: { value: texture } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float uDay;
      uniform float uDoom;
      uniform float uClip;
      uniform float uWinter;
      varying vec2 vUv;
      void main() {
        vec4 t = texture2D(map, vUv);
        if (t.a < 0.5) discard;
        vec3 c = t.rgb * mix(1.1, 1.0, uDay);
        float d = uDoom * uDoom;
        c = mix(c, c * vec3(1.15, 0.8, 0.7), d * 0.4);
        float l = dot(c, vec3(0.3, 0.59, 0.11));
        c = mix(c, vec3(l) * 1.1, uClip);
        c = mix(c, vec3(l) * vec3(0.8, 0.9, 1.1) + 0.15, uWinter);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
