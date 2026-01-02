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
 *              possible.
 *              For now, this class will work as a factory class
 */
import * as THREE from 'three'
import {GPUComputationRenderer} from 'three/addons/misc/GPUComputationRenderer.js'
import type {Variable} from 'three/addons/misc/GPUComputationRenderer.js'
import RendererManager from './renderer-manager.js'

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
   * @type {RendererManager}
   */
  #rendererManager: RendererManager

  /**
   * Constructor
   *
   * @param {RendererManager}  rendererManager
   */
  constructor(rendererManager: RendererManager) {
    this.#rendererManager = rendererManager
  }

  /**
   * Create GPGPU
   *
   * @param   {THREE.TypedArray} texelData
   * @param   {string}           fragmentShader
   * @returns {[GPUComputationRenderer, Variable]}
   * @throws  Error
   * @note    This method will work as a factory method that returns
   *          instances to work with GPGPU
   */
  create(
    texelData: THREE.TypedArray,
    fragmentShader: string,
  ): [GPUComputationRenderer, Variable] {
    const gpGpu = this.#createGpGpuRenderer(texelData)
    const gpGpuVar = this.#createGpGpuVar(gpGpu, texelData, fragmentShader)

    const error = gpGpu.init()
    if (error) {
      throw new Error(error)
    }

    return [gpGpu, gpGpuVar]
  }

  /**
   * Create GPGPU variable
   *
   * @param   {GPUComputationRenderer} gpGpu
   * @param   {THREE.TypedArray}       texelData
   * @param   {string}                 fragmentShader
   * @returns {Variable}
   * @note    For now, `texelData` must have 4 floats for each compute element
   * @note    The variable fragment shader will have the texture uniform used
   *          as FBO (`textureData`), but also a uniform
   *          that preserves the initial texture (`uBaseDataTexture`)
   * @see     DEFAULT_VAR_NAME
   * @see     TEXEL_GROUP_SIZE
   */
  #createGpGpuVar(
    gpGpu: GPUComputationRenderer,
    texelData: THREE.TypedArray,
    fragmentShader: string,
  ): Variable {
    const texture = gpGpu.createTexture()
    const imageData = texture.image.data as THREE.TypedArray
    imageData.set(texelData)

    const gpGpuVar = gpGpu.addVariable(
      DEFAULT_VAR_NAME,
      fragmentShader,
      texture,
    )
    gpGpu.setVariableDependencies(gpGpuVar, [gpGpuVar])

    gpGpuVar.material.uniforms.uBaseDataTexture = new THREE.Uniform(texture)

    return gpGpuVar
  }

  /**
   * Create GPGPU renderer
   *
   * @param   {THREE.TypedArray} texelData
   * @returns {GPUComputationRenderer}
   * @note    For now, `texelData` must have 4 floats for each compute element
   * @see     TEXEL_GROUP_SIZE
   */
  #createGpGpuRenderer(texelData: THREE.TypedArray): GPUComputationRenderer {
    const texelCount = texelData.length / TEXEL_GROUP_SIZE
    const size = Math.ceil(Math.sqrt(texelCount))

    return new GPUComputationRenderer(
      size,
      size,
      this.#rendererManager.renderer,
    )
  }
}
