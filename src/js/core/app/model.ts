/**
 * @description Model
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class handles the logic related to the
 *              transformation of the model into vertices/points/pixels
 */
import * as THREE from 'three'
import GpGpuManager from '../lib/gpgpu-manager.ts'
import vertexShader from './model/shader/vertex.glsl'
import fragmentShader from './model/shader/fragment.glsl'

export default class Model {
  /**
   * @type {THREE.Points}
   */
  points: THREE.Points

  /**
   * @type {GpGpuManager}
   */
  #gpGpuManager: GpGpuManager

  /**
   * Constructor
   *
   * @param {THREE.BufferAttribute} position
   * @param {THREE.BufferAttribute} color
   * @param {GpGpuManager}          gpGpuManager
   */
  constructor(
    position: THREE.BufferAttribute,
    color: THREE.BufferAttribute,
    gpGpuManager: GpGpuManager,
  ) {
    this.#gpGpuManager = gpGpuManager

    this.#initPoints(position, color)
  }

  /**
   * Update
   *
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(elapsedTime: number): void {
    const material = this.points.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = elapsedTime
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.points.geometry.dispose()
    const material = this.points.material as THREE.ShaderMaterial
    material.dispose()
  }

  /**
   * Init points
   *
   * @param   {THREE.BufferAttribute} position
   * @param   {THREE.BufferAttribute} color
   * @returns {void}
   * @todo    Improve cursor uniform names
   * @todo    Improve default value for `uCursor`
   * @todo    Move uniforms related to cursor/pointer to other class
   * @todo    Analyze if the uv should be generated using the points or the
   *          texture
   */
  #initPoints(
    position: THREE.BufferAttribute,
    color: THREE.BufferAttribute,
  ): void {
    this.points = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uPointSize: new THREE.Uniform(5),
          uPointPositionTexture: new THREE.Uniform(null),
          uCursor: new THREE.Uniform(new THREE.Vector3(-99999, -99999, -99999)),
          uCursorStrength: new THREE.Uniform(0.3),
          uCursorBreatheStrength: new THREE.Uniform(0.2),
          uCursorBreatheFrequency: new THREE.Uniform(1),
          uCursorMinRad: new THREE.Uniform(0.5),
          uCursorMaxRad: new THREE.Uniform(2),
          uTime: new THREE.Uniform(0),
        },
      }),
    )

    const vertices = position.count

    this.points.geometry.setDrawRange(0, vertices)

    const randomSizeArray = new Float32Array(vertices)
    const uvArray = new Float32Array(vertices * 2)
    const renderTarget = this.#gpGpuManager?.getCurrentFbo()
    const width = renderTarget?.width ?? 0
    const height = renderTarget?.height ?? 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        const i2 = i * 2

        uvArray[i2 + 0] = (x + 0.5) / width
        uvArray[i2 + 1] = (y + 0.5) / height

        randomSizeArray[i] = Math.random()
      }
    }
    this.points.geometry.setAttribute(
      'aUvPoint',
      new THREE.BufferAttribute(uvArray, 2),
    )
    this.points.geometry.setAttribute('aColor', color)
    this.points.geometry.setAttribute(
      'aPointSize',
      new THREE.BufferAttribute(randomSizeArray, 1),
    )
  }
}
