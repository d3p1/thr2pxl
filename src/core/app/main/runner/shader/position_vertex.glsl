/**
 * @description Shader chunk used to handle
 *              model vertex/point/pixel displacement
 *              on pointer interaction
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
vec4 vertexPosition = texture(uPointPositionTexture, aUvPoint);

vec3  displacementVector    = vertexPosition.xyz - uPointer.xyz;
vec3  displacementDirection = normalize(displacementVector);
float displacementDistance  = length(displacementVector);
      displacementDistance  = max(uPointerMinRad, displacementDistance);
      displacementDistance  = min(uPointerMaxRad, displacementDistance);
float displacementStrength  = mix(
    1.0 / uPointerMinRad,
    0.0,
    displacementDistance / uPointerMaxRad
);

vertexPosition.xyz += displacementDirection               *
                      uPointerStrength                    *
                      displacementStrength                +
                      displacementDirection               *
                      sin(uTime * uPointerPulseFrequency) *
                      uPointerPulseStrength               *
                      displacementStrength;