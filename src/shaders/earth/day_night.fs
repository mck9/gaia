uniform sampler2D nightTexture;
//uniform sampler2D dayTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

void main( void ) {
  vec4 nightColor = texture2D( nightTexture, vUv ).rgba;
  //vec4 nightColor = texture2D( nightTexture, vUv );
  //vec4 dayColor = texture2D( dayTexture, vUv );

  // compute cosine sun to normal so -1 is away from sun and +1 is toward sun.
  float cosineAngleSunToNormal = dot(normalize(vNormal), normalize(vSunDir));

  // sharpen the edge beween the transition
  cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 5.0, -1.0, 1.0);

  // convert to 0 to 1 for mixing
  float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;

  gl_FragColor = vec4(nightColor.xyz, 1.0 - mixAmount);
  // gl_FragColor = mix(nightColor, dayColor, mixAmount);

  // comment in the next line to see the mixAmount
  // gl_FragColor = vec4( mixAmount, mixAmount, mixAmount, 1.0 );
}
