/**
 * @description Flow field manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class handles the logic related to the
 *              flow field applied to the model
 */
import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/addons/misc/GPUComputationRenderer.js'
import GpGpuManager from '../../../lib/gpgpu-manager.js'
import fragmentShader from './shader/fragment.glsl'

export default class FlowFieldManager {
  /**
   * @type {Float32Array}
   * @note UV coordinates generated to access texel data
   */
  texelUv: Float32Array

  /**
   * @type {Float32Array}
   * @note Initial texel data used to create GPGPU texture
   */
  texelData: Float32Array

  /**
   * @type {Variable}
   */
  #gpGpuVar: Variable

  /**
   * @type {GPUComputationRenderer}
   */
  #gpGpu: GPUComputationRenderer

  /**
   * @type {GpGpuManager}
   */
  #gpGpuManager: GpGpuManager

  /**
   * Constructor
   *
   * @param {GpGpuManager} gpGpuManager
   */
  constructor(gpGpuManager: GpGpuManager) {
    this.#gpGpuManager = gpGpuManager
  }

  /**
   * Get the current render target
   *
   * @returns {THREE.WebGLRenderTarget<THREE.Texture>}
   */
  getCurrentRenderTarget(): THREE.WebGLRenderTarget<THREE.Texture> {
    return this.#gpGpu.getCurrentRenderTarget(this.#gpGpuVar)
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(deltaTime: number, elapsedTime: number): void {
    this.#gpGpuVar.material.uniforms.uTime.value = elapsedTime
    this.#gpGpuVar.material.uniforms.uDeltaTime.value = deltaTime
    this.#gpGpu.compute()
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    this.#gpGpu.dispose()
  }

  /**
   * Init flow field from the model position attribute
   *
   * @param   {THREE.BufferAttribute} position
   * @returns {void}
   */
  init(position: THREE.BufferAttribute): void {
    const vertices = position.count
    const size = Math.ceil(Math.sqrt(vertices))
    this.texelData = new Float32Array(vertices * 4)
    this.texelUv = new Float32Array(vertices * 2)

    for (let i = 0; i < vertices; i++) {
      this.#generateTexelDataFromVertex(i, position)
      this.#generateTexelUvFromVertex(i, size)
    }

    ;[this.#gpGpu, this.#gpGpuVar] = this.#gpGpuManager.create(
      this.texelData,
      fragmentShader,
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

  /**
   * Generate texel data from vertex index
   *
   * @param   {number}                i
   * @param   {THREE.BufferAttribute} position
   * @returns {void}
   */
  #generateTexelDataFromVertex(
    i: number,
    position: THREE.BufferAttribute,
  ): void {
    const i3 = i * 3
    const i4 = i * 4

    this.texelData[i4 + 0] = position.array[i3 + 0]
    this.texelData[i4 + 1] = position.array[i3 + 1]
    this.texelData[i4 + 2] = position.array[i3 + 2]
    this.texelData[i4 + 3] = Math.random()
  }

  /**
   * Generate texel UV from vertex index
   *
   * @param   {number} i
   * @param   {number} size
   * @returns {void}
   * @note    The texture will be a square texture of width and height of `size`.
   *          The UV will work as an index to get vertex position from texture.
   *          That is why we generate UV here taking into consideration
   *          that texture size is `size`.
   *          This is a data texture
   *          that works as a lookup table, and the UV is the index to get
   *          the position of a given vertex
   */
  #generateTexelUvFromVertex(i: number, size: number): void {
    const i2 = i * 2
    const u = ((i + 0.5) % size) / size
    const v = (Math.floor(i / size) + 0.5) / size
    this.texelUv[i2 + 0] = u
    this.texelUv[i2 + 1] = v
  }
}
