uniform vec3	glowColor;
uniform float	coeficient;
uniform float	power;
uniform vec3    sunPosition;

varying vec3	vNormal;
varying vec3	vVertexWorldPosition;

void main(){
  vec3 vViewLightPos = (viewMatrix * vec4(sunPosition, 1.0)).xyz;
  float cosineAngleSunToNormal = dot(normalize(vNormal), normalize(vViewLightPos));
  cosineAngleSunToNormal = clamp( cosineAngleSunToNormal * 10.0, -1.0, 1.0);
  float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;

  vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
  vec3 viewCameraToVertex  = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
  viewCameraToVertex       = normalize(viewCameraToVertex);
  float intensity	   = pow(coeficient + dot(vNormal, viewCameraToVertex), power);
  gl_FragColor = vec4(glowColor, intensity * mixAmount);
}
