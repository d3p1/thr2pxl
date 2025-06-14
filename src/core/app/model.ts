/**
 * @description Model
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class handles the logic related to the
 *              transformation of the model into vertices/points/pixels
 */
import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/addons/misc/GPUComputationRenderer.js'
import GpGpuManager from '../lib/gpgpu-manager.js'
import AbstractEntity from './abstract-entity.js'
import vertexShader from './model/shader/vertex.glsl'
import fragmentShader from './model/shader/fragment.glsl'
import gpGpuFragmentShader from './model/shader/gpgpu.glsl'

export default class Model {
  /**
   * @type {THREE.Points}
   */
  points: THREE.Points

  /**
   * @type {Variable | null}
   */
  #gpGpuVar: Variable | null = null

  /**
   * @type {GPUComputationRenderer | null}
   */
  #gpGpu: GPUComputationRenderer | null = null

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
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(deltaTime: number, elapsedTime: number): void {
    if (this.#gpGpu && this.#gpGpuVar) {
      this.#gpGpuVar.material.uniforms.uTime.value = elapsedTime
      this.#gpGpuVar.material.uniforms.uDeltaTime.value = deltaTime
      this.#gpGpu.compute()

      const material = this.points.material as THREE.ShaderMaterial
      const fbo = this.#gpGpu.getCurrentRenderTarget(this.#gpGpuVar)
      if (fbo) {
        material.uniforms.uPointPositionTexture.value = fbo.texture
      }
      material.uniforms.uTime.value = elapsedTime
    }
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.#gpGpu?.dispose()
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
    this.#initGpGpu(position)

    if (this.#gpGpu && this.#gpGpuVar) {
      this.points = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          uniforms: {
            uPointSize: new THREE.Uniform(5),
            uPointPositionTexture: new THREE.Uniform(null),
            uCursor: new THREE.Uniform(
              new THREE.Vector3(-99999, -99999, -99999),
            ),
            uCursorStrength: new THREE.Uniform(0.3),
            uCursorPulseStrength: new THREE.Uniform(0.2),
            uCursorPulseFrequency: new THREE.Uniform(1),
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
      const renderTarget = this.#gpGpu.getCurrentRenderTarget(this.#gpGpuVar)
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

  /**
   * Init GPGPU
   *
   * @param   {THREE.BufferAttribute} position
   * @returns {void}
   */
  #initGpGpu(position: THREE.BufferAttribute): void {
    const vertices = position.count
    const positionArray = position.array
    const texelData = new Float32Array(vertices * 4)

    for (let i = 0; i < vertices; i++) {
      const i3 = i * 3
      const i4 = i * 4

      texelData[i4 + 0] = positionArray[i3 + 0]
      texelData[i4 + 1] = positionArray[i3 + 1]
      texelData[i4 + 2] = positionArray[i3 + 2]
      texelData[i4 + 3] = Math.random()
    }

    ;[this.#gpGpu, this.#gpGpuVar] = this.#gpGpuManager.create(
      texelData,
      gpGpuFragmentShader,
    )

    this.#gpGpuVar.material.uniforms.uTime = new THREE.Uniform(0)
    this.#gpGpuVar.material.uniforms.uDeltaTime = new THREE.Uniform(0)
    this.#gpGpuVar.material.uniforms.uFlowFieldChangeFrequency =
      new THREE.Uniform(0.1)
    this.#gpGpuVar.material.uniforms.uFlowFieldStrength = new THREE.Uniform(3)
    this.#gpGpuVar.material.uniforms.uFlowFieldStrengthRatio =
      new THREE.Uniform(0.25)
    this.#gpGpuVar.material.uniforms.uParticleLifeDecay = new THREE.Uniform(
      0.01,
    )
  }
}
