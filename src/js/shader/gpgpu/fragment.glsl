/**
 * @description Fragment shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
uniform float     uTime;
uniform float     uDeltaTime;
uniform sampler2D uBasePosition;

#include ../utils/calcSimplexNoise4d.glsl

void main() {
    vec2  uv                       = gl_FragCoord.xy / resolution.xy;
    vec4  position                 = texture(texturePoint, uv);
    vec4  basePosition             = texture(uBasePosition, uv);
    float flowFieldChangeFrequency = 0.5;
    float flowFieldStrength        = 0.5;
    float flowFieldStrengthRatio   = 0.25;
    float particleDecay            = 0.01;

    if (position.a >= 1.0) {
        position.a   = 0.0;
        position.xyz = basePosition.xyz;
    }
    else {
        float strength = calcSimplexNoise4d(
            vec4(basePosition.xyz, uTime * flowFieldChangeFrequency)
        );
        strength = smoothstep(
            1.0 - (flowFieldStrengthRatio) * 2.0,
            1.0,
            strength
        );

        vec3 flowField = vec3(
            calcSimplexNoise4d(
                vec4(position.xyz + 0.0, uTime * flowFieldChangeFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 1.0, uTime * flowFieldChangeFrequency)
            ),
            calcSimplexNoise4d(
                vec4(position.xyz + 2.0, uTime * flowFieldChangeFrequency)
            )
        );
        flowField     = normalize(flowField);
        position.xyz += flowField * strength * flowFieldStrength * uDeltaTime;

        position.a += particleDecay * uDeltaTime;
    }

    gl_FragColor = position;
}