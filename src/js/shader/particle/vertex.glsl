/**
 * @description Vertex shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
uniform float uPointSize;
uniform sampler2D uPointPositionTexture;

attribute vec2 aUvPoint;
attribute vec4 aColor;

varying vec4 vColor;

void main() {
    vec4 pointPosition = texture(uPointPositionTexture, aUvPoint);

    vec4 modelPosition      = modelMatrix      * vec4(pointPosition.xyz, 1.0);
    vec4 viewPosition       = viewMatrix       * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position   = projectionPosition;
    gl_PointSize  = uPointSize;
    gl_PointSize *= -(1.0 / viewPosition.z);

    vColor = aColor;
}