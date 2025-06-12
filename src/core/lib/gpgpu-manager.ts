/**
 * @description GPGPU manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              GPGPU logic.
 *              It is important to highlight that this class will
 *              keep things as general as possible, but some aspects
 *              will be adapted for the requirements of this implementation
 *              (i.e.: this implementation only requires one GPGPU variable).
 *              In this way, it is possible to keep this class as simple as
 *              possible
 */
import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/addons/misc/GPUComputationRenderer.js'
import RendererManager from './renderer-manager.ts'

/**
 * @constant
 * @type  {string}
 * @note  It is used the recommended `texture` prefix
 * {@link https://github.com/mrdoob/three.js/blob/8286a475fd8ee00ef07d1049db9bb1965960057b/examples/jsm/misc/GPUComputationRenderer.js#L31}
 */
const DEFAULT_VAR_NAME: string = 'textureData'

/**
 * @constant
 * @type  {number}
 * {@link https://github.com/mrdoob/three.js/blob/8286a475fd8ee00ef07d1049db9bb1965960057b/examples/jsm/misc/GPUComputationRenderer.js#L18}
 */
const TEXEL_GROUP_SIZE: number = 4

export default class GpGpuManager {
  /**
   * @type {GPUComputationRenderer}
   */
  gpGpu: GPUComputationRenderer

  /**
   * @type {Variable}
   */
  gpGpuVar: Variable

  /**
   * @type {RendererManager}
   */
  #rendererManager: RendererManager

  /**
   * Constructor
   *
   * @param {THREE.TypedArray} texelData
   * @param {string}           fragmentShader
   * @param {RendererManager}  rendererManager
   */
  constructor(
    texelData: THREE.TypedArray,
    fragmentShader: string,
    rendererManager: RendererManager,
  ) {
    this.#rendererManager = rendererManager

    this.#initGpGpu(texelData, fragmentShader)
  }

  /**
   * Get current FBO
   *
   * @returns {THREE.WebGLRenderTarget<THREE.Texture> | null}
   */
  getCurrentFbo(): THREE.WebGLRenderTarget<THREE.Texture> | null {
    return this.gpGpu.getCurrentRenderTarget(this.gpGpuVar)
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(deltaTime: number, elapsedTime: number): void {
    this.gpGpuVar.material.uniforms.uDeltaTime.value = deltaTime
    this.gpGpuVar.material.uniforms.uTime.value = elapsedTime
    this.gpGpu.compute()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.gpGpu.dispose()
  }

  /**
   * Init GPGPU
   *
   * @param   {THREE.TypedArray} texelData
   * @param   {string}           fragmentShader
   * @returns {void}
   */
  #initGpGpu(texelData: THREE.TypedArray, fragmentShader: string): void {
    this.#initGpGpuRenderer(texelData)
    this.#initGpGpuVar(texelData, fragmentShader)

    const error = this.gpGpu.init()
    if (error) {
      console.error(error)
    }
  }

  /**
   * Init GPGPU variable
   *
   * @param   {THREE.TypedArray} texelData
   * @param   {string}           fragmentShader
   * @returns {void}
   * @note    `texelData` must have 4 floats for each compute element
   * @note    The variable fragment shader will have the texture uniform used
   *          as FBO (`textureData`), but also a uniform
   *          that preserves the initial texture (`uBaseDataTexture`),
   *          another one that has the delta time (`uDeltaTime`),
   *          and a final one that has the elapsed time (`uTime`)
   * @see     DEFAULT_VAR_NAME
   * @see     TEXEL_GROUP_SIZE
   */
  #initGpGpuVar(texelData: THREE.TypedArray, fragmentShader: string): void {
    const texture = this.gpGpu.createTexture()
    const imageData = texture.image.data as THREE.TypedArray
    imageData.set(texelData)

    this.gpGpuVar = this.gpGpu.addVariable(
      DEFAULT_VAR_NAME,
      fragmentShader,
      texture,
    )
    this.gpGpu.setVariableDependencies(this.gpGpuVar, [this.gpGpuVar])

    this.gpGpuVar.material.uniforms.uBaseDataTexture = new THREE.Uniform(
      texture,
    )
    this.gpGpuVar.material.uniforms.uDeltaTime = new THREE.Uniform(0)
    this.gpGpuVar.material.uniforms.uTime = new THREE.Uniform(0)
  }

  /**
   * Init GPGPU renderer
   *
   * @param   {THREE.TypedArray} texelData
   * @returns {void}
   * @note    For now, `texelData` must have 4 floats for each compute element
   * @see     TEXEL_GROUP_SIZE
   */
  #initGpGpuRenderer(texelData: THREE.TypedArray): void {
    const texelCount = texelData.length / TEXEL_GROUP_SIZE
    const size = Math.ceil(Math.sqrt(texelCount))

    this.gpGpu = new GPUComputationRenderer(
      size,
      size,
      this.#rendererManager.renderer,
    )
  }
}
