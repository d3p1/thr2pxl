/**
 * @description Fragment shader
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture(texturePoint, uv);

    position.y += 0.01;

    gl_FragColor = position;
}