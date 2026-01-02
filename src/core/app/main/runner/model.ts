/**
 * @description Model
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class handles the logic related to the
 *              transformation of the model into vertices/points/pixels
 */
import * as THREE from 'three'
import ModelLoaderManager from '../../../services/model-loader-manager.js'
import AbstractEntity from './abstract-entity.js'
import FlowFieldManager from './model/gpgpu/flow-field-manager.js'
import DebugManager from '../../../services/debug-manager.js'
import vertexShader from './model/shader/vertex.glsl'
import fragmentShader from './model/shader/fragment.glsl'

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINT_SIZE: number = 5

export default class Model extends AbstractEntity {
  /**
   * @type {THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null}
   */
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null

  /**
   * @type {FlowFieldManager | null}
   */
  readonly #flowFieldManager: FlowFieldManager | null = null

  /**
   * @type {DebugManager}
   */
  readonly #debugManager: DebugManager

  /**
   * @type {number}
   */
  readonly #pointSize: number

  /**
   * Constructor
   *
   * @param {FlowFieldManager}   flowFieldManager
   * @param {DebugManager}       debugManager
   * @param {string}             modelUrl
   * @param {ModelLoaderManager} modelLoaderManager
   * @param {number}             pointSize
   */
  constructor(
    flowFieldManager: FlowFieldManager,
    debugManager: DebugManager,
    modelUrl: string,
    modelLoaderManager: ModelLoaderManager,
    pointSize: number = DEFAULT_POINT_SIZE,
  ) {
    super(modelUrl, modelLoaderManager)

    this.#flowFieldManager = flowFieldManager
    this.#debugManager = debugManager
    this.#pointSize = pointSize
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   */
  update(deltaTime: number, elapsedTime: number): void {
    if (this.points && this.#flowFieldManager) {
      this.#flowFieldManager.update(deltaTime, elapsedTime)

      const fbo = this.#flowFieldManager.getCurrentRenderTarget()
      if (fbo) {
        this.points.material.uniforms.uPointPositionTexture.value = fbo.texture
      }
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
    this.#initFlowFieldManager(position)
    this.#initPoints(position, color)
  }

  /**
   * Enable debug mode
   *
   * @returns {void}
   */
  debug(): void {
    if (this.points) {
      const pointFolder = this.#debugManager.addFolder({
        title: 'Model Point',
      })

      this.#debugManager.addBindingWithOnChange(
        this.points.material.uniforms.uPointSize,
        'value',
        'size',
        {min: 0.1, max: 50, step: 0.1},
        pointFolder,
      )
    }

    this.#flowFieldManager?.debug()
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    this.#flowFieldManager?.dispose()
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
          uPointSize: new THREE.Uniform(this.#pointSize),
          uPointPositionTexture: new THREE.Uniform(null),
        },
      }),
    )
    this.points.geometry.setDrawRange(0, position.count)

    this.#initPointAttributes(position, color)

    this.mesh?.geometry.dispose()
    this.mesh?.material.dispose()
    this.mesh = null
  }

  /**
   * Init point attributes
   *
   * @param   {THREE.BufferAttribute} position
   * @param   {THREE.BufferAttribute} color
   * @returns {void}
   */
  #initPointAttributes(
    position: THREE.BufferAttribute,
    color: THREE.BufferAttribute,
  ): void {
    const randomSizeArray = new Float32Array(position.count)
    for (let i = 0; i < position.count; i++) {
      randomSizeArray[i] = Math.random()
    }
    this.points?.geometry.setAttribute(
      'aPointSize',
      new THREE.BufferAttribute(randomSizeArray, 1),
    )

    if (this.#flowFieldManager) {
      this.points?.geometry.setAttribute(
        'aUvPoint',
        new THREE.BufferAttribute(this.#flowFieldManager.texelUv, 2),
      )
    }

    this.points?.geometry.setAttribute('aColor', color)
  }

  /**
   * Init flow field manager
   *
   * @param   {THREE.BufferAttribute} position
   * @returns {void}
   */
  #initFlowFieldManager(position: THREE.BufferAttribute): void {
    this.#flowFieldManager?.init(position)
  }
}
