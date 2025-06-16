/**
 * @description Shader chunk used to define params used in the
 *              model vertex shader to handle vertex/point/pixel displacement
 *              on pointer interaction
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This file is called `pars_vertex.glsl` to mantain the
 *              same naming style used by Three.js for its `.glsl` chunk
 *              files that define shader params
 */
uniform float uTime;
uniform vec3  uPointer;
uniform float uPointerStrength;
uniform float uPointerMinRad;
uniform float uPointerMaxRad;
uniform float uPointerPulseStrength;
uniform float uPointerPulseFrequency;

varying vec4 vColor;