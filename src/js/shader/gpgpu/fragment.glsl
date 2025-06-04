/**
 * @description Fragment shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
uniform float     uTime;
uniform float     uDeltaTime;
uniform sampler2D uBasePosition;
uniform float     uFlowFieldChangeFrequency;
uniform float     uFlowFieldStrength;
uniform float     uFlowFieldStrengthRatio;
uniform float     uParticleLifeDecay;

#include ../utils/calcSimplexNoise4d.glsl

void main() {
    vec2  uv           = gl_FragCoord.xy / resolution.xy;
    vec4  position     = texture(texturePoint, uv);
    vec4  basePosition = texture(uBasePosition, uv);

    if (position.a >= 1.0) {
        position.a   = 0.0;
        position.xyz = basePosition.xyz;
    }
    else {
        float strength = calcSimplexNoise4d(
            vec4(basePosition.xyz, uTime * uFlowFieldChangeFrequency)
        );
        strength = smoothstep(
            1.0 - 2.0 * uFlowFieldStrengthRatio,
            1.0,
            strength
        );

        vec3 flowField = vec3(
            calcSimplexNoise4d(
                vec4(position.xyz + 0.0, uTime * uFlowFieldChangeFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 1.0, uTime * uFlowFieldChangeFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 2.0, uTime * uFlowFieldChangeFrequency)
            )
        );
        flowField     = normalize(flowField);
        position.xyz += flowField * strength * uFlowFieldStrength * uDeltaTime;

        position.a += uParticleLifeDecay * uDeltaTime;
    }

    gl_FragColor = position;
}