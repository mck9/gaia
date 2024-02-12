varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

uniform vec3 sunPosition;

void main(void) {
  vUv = uv;

  vec4 vViewPos4 = modelViewMatrix * vec4(position, 1.0);

  vNormal = normalMatrix * normal;
  vSunDir = mat3(viewMatrix) * normalize(sunPosition);

  gl_Position = projectionMatrix * vViewPos4;
}
