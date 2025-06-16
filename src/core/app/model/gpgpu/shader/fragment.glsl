/**
 * @description GPGPU fragment shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
uniform float     uTime;
uniform float     uDeltaTime;
uniform sampler2D uBaseDataTexture;
uniform float     uFlowFieldFrequency;
uniform float     uFlowFieldStrength;
uniform float     uFlowFieldRatio;
uniform float     uFlowFieldPointLifeDecay;

#include ./utils/calcSimplexNoise4d.glsl

void main() {
    vec2  uv           = gl_FragCoord.xy / resolution.xy;
    vec4  position     = texture(textureData, uv);
    vec4  basePosition = texture(uBaseDataTexture, uv);

    if (position.a >= 1.0) {
        position.a   = 0.0;
        position.xyz = basePosition.xyz;
    }
    else {
        float strength = calcSimplexNoise4d(
            vec4(basePosition.xyz, uTime * uFlowFieldFrequency)
        );
        strength = smoothstep(
            1.0 - 2.0 * uFlowFieldRatio,
            1.0,
            strength
        );

        vec3 flowField = vec3(
            calcSimplexNoise4d(
                vec4(position.xyz + 0.0, uTime * uFlowFieldFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 1.0, uTime * uFlowFieldFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 2.0, uTime * uFlowFieldFrequency)
            )
        );
        flowField     = normalize(flowField);
        position.xyz += flowField * strength * uFlowFieldStrength * uDeltaTime;

        position.a += uFlowFieldPointLifeDecay * uDeltaTime;
    }

    gl_FragColor = position;
}