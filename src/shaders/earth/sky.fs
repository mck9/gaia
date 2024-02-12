uniform sampler2D map;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(map, vUv).rgba;
  gl_FragColor = vec4(color.xyz, color.w);
}
