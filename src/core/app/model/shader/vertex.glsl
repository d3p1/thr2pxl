/**
 * @description Vertex shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @todo        Because model is init in the origin of the scene,
 *              local space (`position`) and world space (`modelPosition`)
 *              are the same.
 *              Analyze if it is not better/more intuitive to use `position`
 * @todo        Move cursor related logic to other shader chunk
 */
uniform float     uTime;
uniform float     uPointSize;
uniform sampler2D uPointPositionTexture;
uniform vec3      uPointer;
uniform float     uPointerStrength;
uniform float     uPointerPulseStrength;
uniform float     uPointerPulseFrequency;
uniform float     uPointerMinRad;
uniform float     uPointerMaxRad;

attribute vec2  aUvPoint;
attribute vec4  aColor;
attribute float aPointSize;

varying vec4 vColor;

void main() {
    vec4 pointPosition = texture(uPointPositionTexture, aUvPoint);

    vec4 modelPosition = modelMatrix * vec4(pointPosition.xyz, 1.0);

    vec3  displacementVector    = modelPosition.xyz - uPointer.xyz;
    vec3  displacementDirection = normalize(displacementVector);
    float displacementDistance  = length(displacementVector);
          displacementDistance  = max(uPointerMinRad, displacementDistance);
          displacementDistance  = min(uPointerMaxRad, displacementDistance);
    float displacementStrength  = mix(
        1.0 / uPointerMinRad,
        0.0,
        displacementDistance / uPointerMaxRad
    );
    modelPosition.xyz += displacementDirection               *
                         uPointerStrength                    *
                         displacementStrength                +
                         displacementDirection               *
                         sin(uTime * uPointerPulseFrequency) *
                         uPointerPulseStrength               *
                         displacementStrength;

    vec4 viewPosition       = viewMatrix       * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    float sizeIn  = smoothstep(0.0, 0.2, pointPosition.a);
    float sizeOut = 1.0 - smoothstep(0.8, 1.0, pointPosition.a);
    float size    = min(sizeIn, sizeOut);

    gl_Position   = projectionPosition;
    gl_PointSize  = uPointSize * aPointSize * size;
    gl_PointSize *= -(1.0 / viewPosition.z);

    vColor = aColor;
}
