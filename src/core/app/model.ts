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
import ModelLoaderManager from '../lib/model-loader-manager.js'
import GpGpuManager from '../lib/gpgpu-manager.js'
import AbstractEntity from './abstract-entity.js'
import vertexShader from './model/shader/vertex.glsl'
import fragmentShader from './model/shader/fragment.glsl'
import gpGpuFragmentShader from './model/shader/gpgpu.glsl'

export default class Model extends AbstractEntity {
  /**
   * @type {THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null}
   */
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null

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
   * @param {GpGpuManager}       gpGpuManager
   * @param {string}             modelUrl
   * @param {ModelLoaderManager} modelLoaderManager
   */
  constructor(
    gpGpuManager: GpGpuManager,
    modelUrl: string,
    modelLoaderManager: ModelLoaderManager,
  ) {
    super(modelUrl, modelLoaderManager)

    this.#gpGpuManager = gpGpuManager
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(deltaTime: number, elapsedTime: number): void {
    if (this.points && this.#gpGpu && this.#gpGpuVar) {
      this.#gpGpuVar.material.uniforms.uTime.value = elapsedTime
      this.#gpGpuVar.material.uniforms.uDeltaTime.value = deltaTime
      this.#gpGpu.compute()

      const fbo = this.#gpGpu.getCurrentRenderTarget(this.#gpGpuVar)
      if (fbo) {
        this.points.material.uniforms.uPointPositionTexture.value = fbo.texture
      }
      this.points.material.uniforms.uTime.value = elapsedTime
    }
  }

  /**
   * @inheritdoc
   */
  async load(): Promise<void> {
    await super.load()
    const position = this.mesh?.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute
    const color = this.mesh?.geometry.getAttribute(
      'color',
    ) as THREE.BufferAttribute
    this.#initPoints(position, color)
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    this.#gpGpu?.dispose()
    this.points?.geometry.dispose()
    this.points?.material.dispose()

    super.dispose()
  }

  /**
   * Init points
   *
   * @param   {THREE.BufferAttribute} position
   * @param   {THREE.BufferAttribute} color
   * @returns {void}
   * @todo    Improve default value for `uPointer`
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
            uPointer: new THREE.Uniform(
              new THREE.Vector3(-99999, -99999, -99999),
            ),
            uPointerStrength: new THREE.Uniform(0.3),
            uPointerPulseStrength: new THREE.Uniform(0.2),
            uPointerPulseFrequency: new THREE.Uniform(1),
            uPointerMinRad: new THREE.Uniform(0.5),
            uPointerMaxRad: new THREE.Uniform(2),
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

      this.mesh?.geometry.dispose()
      this.mesh?.material.dispose()
      this.mesh = null
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
