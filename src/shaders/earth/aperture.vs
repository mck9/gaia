varying vec3	vVertexWorldPosition;
varying vec3	vNormal;
varying vec4	vFragColor;
void main(void){
  vNormal	= normalize(normalMatrix * normal);
  vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
