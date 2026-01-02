/**
 * @description Runner
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class will manage how the renderer manager,
 *              debug manager, the model, the pointer
 *              and the motion (i.e.: flow field)
 *              interact between each other
 */
import * as THREE from 'three'
import RendererManager from '../../services/renderer-manager.js'
import Pointer from './runner/pointer.js'
import Model from './runner/model.js'
import DebugManager from '../../services/debug-manager.js'
import parsVertexShader from './runner/shader/pars_vertex.glsl'
import positionVertexShader from './runner/shader/position_vertex.glsl'

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINTER_STRENGTH: number = 0.3

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINTER_MIN_RAD: number = 0.5

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINTER_MAX_RAD: number = 2

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINTER_PULSE_STRENGTH: number = 0.2

/**
 * @constant
 * @type {number}
 */
const DEFAULT_POINTER_PULSE_FREQUENCY: number = 1

export default class Runner {
  /**
   * @type {Model}
   */
  readonly model: Model

  /**
   * @type {Pointer}
   */
  readonly pointer: Pointer

  /**
   * @type {RendererManager}
   */
  readonly #rendererManager: RendererManager

  /**
   * @type {DebugManager}
   */
  readonly #debugManager: DebugManager

  /**
   * Constructor
   *
   * @param {Model}           model
   * @param {Pointer}         pointer
   * @param {RendererManager} rendererManager
   * @param {DebugManager}    debugManager
   * @param {number}          pointerStrength
   * @param {number}          pointerMinRad
   * @param {number}          pointerMaxRad
   * @param {number}          pointerPulseStrength
   * @param {number}          pointerPulseFrequency
   */
  constructor(
    model: Model,
    pointer: Pointer,
    rendererManager: RendererManager,
    debugManager: DebugManager,
    pointerStrength: number = DEFAULT_POINTER_STRENGTH,
    pointerMinRad: number = DEFAULT_POINTER_MIN_RAD,
    pointerMaxRad: number = DEFAULT_POINTER_MAX_RAD,
    pointerPulseStrength: number = DEFAULT_POINTER_PULSE_STRENGTH,
    pointerPulseFrequency: number = DEFAULT_POINTER_PULSE_FREQUENCY,
  ) {
    this.model = model
    this.pointer = pointer
    this.#rendererManager = rendererManager
    this.#debugManager = debugManager

    this.#initPointer()
    this.#initModel(
      pointerStrength,
      pointerMinRad,
      pointerMaxRad,
      pointerPulseStrength,
      pointerPulseFrequency,
    )
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @param   {number} elapsedTime
   * @returns {void}
   * @note    It is required to validate that `uTime` uniform
   *          is already set because can occur that the model is already loaded
   *          but still was not customized its shaders before compilation
   */
  update(deltaTime: number, elapsedTime: number): void {
    if (this.model.points && this.model.points.material.uniforms.uTime) {
      this.model.update(deltaTime, elapsedTime)

      this.model.points.material.uniforms.uTime.value = elapsedTime

      if (this.pointer && this.pointer.intersections.length) {
        this.model.points.material.uniforms.uPointer.value.set(
          ...this.pointer.intersections[0].point,
        )
      } else {
        this.#disablePointer()
      }
    }
  }

  /**
   * Enable debug mode
   *
   * @returns {void}
   */
  debug(): void {
    if (this.model.points) {
      const pointerFolder = this.#debugManager.addFolder({
        title: 'Pointer',
      })

      this.#debugManager.addBindingWithOnChange(
        this.model.points.material.uniforms.uPointerStrength,
        'value',
        'strength',
        {min: 0, max: 5, step: 0.01},
        pointerFolder,
      )

      this.#debugManager.addBindingWithOnChange(
        this.model.points.material.uniforms.uPointerMinRad,
        'value',
        'min-rad',
        {min: 0.01, max: 5, step: 0.01},
        pointerFolder,
      )

      this.#debugManager.addBindingWithOnChange(
        this.model.points.material.uniforms.uPointerMaxRad,
        'value',
        'max-rad',
        {min: 0.02, max: 10, step: 0.01},
        pointerFolder,
      )

      this.#debugManager.addBindingWithOnChange(
        this.model.points.material.uniforms.uPointerPulseStrength,
        'value',
        'pulse-strength',
        {min: 0, max: 2, step: 0.01},
        pointerFolder,
      )

      this.#debugManager.addBindingWithOnChange(
        this.model.points.material.uniforms.uPointerPulseFrequency,
        'value',
        'pulse-frequency',
        {min: 0, max: 5, step: 0.01},
        pointerFolder,
      )
    }

    this.model.debug()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.pointer.dispose()
    this.model.dispose()
  }

  /**
   * Init pointer
   *
   * @returns {void}
   * @note    Set low poly model (raycaster model) at the center of the scene
   *          (the same position used for the model)
   */
  #initPointer(): void {
    this.pointer.load().then(() => {
      if (this.pointer.mesh) {
        this.pointer.mesh.position.set(0, 0, 0)
        this.pointer.mesh.visible = false
        this.#rendererManager.scene.add(this.pointer.mesh)
      }
    })
  }

  /**
   * Init model
   *
   * @param   {number} pointerStrength
   * @param   {number} pointerMinRad
   * @param   {number} pointerMaxRad
   * @param   {number} pointerPulseStrength
   * @param   {number} pointerPulseFrequency
   * @returns {void}
   * @note    Set model at the center of the scene
   * @note    Add pointer effect to model
   */
  #initModel(
    pointerStrength: number,
    pointerMinRad: number,
    pointerMaxRad: number,
    pointerPulseStrength: number,
    pointerPulseFrequency: number,
  ): void {
    this.model.load().then(() => {
      if (this.model.points) {
        this.#addPointerHandlerToModel(
          pointerStrength,
          pointerMinRad,
          pointerMaxRad,
          pointerPulseStrength,
          pointerPulseFrequency,
        )

        this.model.points.position.set(0, 0, 0)
        this.#rendererManager.scene.add(this.model.points)
      }
    })
  }

  /**
   * Add pointer handler to model
   *
   * @param   {number} pointerStrength
   * @param   {number} pointerMinRad
   * @param   {number} pointerMaxRad
   * @param   {number} pointerPulseStrength
   * @param   {number} pointerPulseFrequency
   * @returns {void}
   * @note    Force shader compilation with `compile()`.
   *          If it is not forced the shader compilation, then
   *          uniforms will be undefined until first render of the scene
   * {@link   https://github.com/mrdoob/three.js/pull/10960}
   */
  #addPointerHandlerToModel(
    pointerStrength: number,
    pointerMinRad: number,
    pointerMaxRad: number,
    pointerPulseStrength: number,
    pointerPulseFrequency: number,
  ): void {
    if (this.model.points) {
      this.model.points.material.onBeforeCompile = (shader) => {
        if (this.model.points) {
          this.model.points.material.uniforms.uPointer = new THREE.Uniform(
            new THREE.Vector3(),
          )
          this.model.points.material.uniforms.uPointerStrength =
            new THREE.Uniform(pointerStrength)
          this.model.points.material.uniforms.uPointerMinRad =
            new THREE.Uniform(pointerMinRad)
          this.model.points.material.uniforms.uPointerMaxRad =
            new THREE.Uniform(pointerMaxRad)
          this.model.points.material.uniforms.uPointerPulseStrength =
            new THREE.Uniform(pointerPulseStrength)
          this.model.points.material.uniforms.uPointerPulseFrequency =
            new THREE.Uniform(pointerPulseFrequency)
          this.model.points.material.uniforms.uTime = new THREE.Uniform(0)

          shader.vertexShader = shader.vertexShader.replace(
            'varying vec4 vColor;',
            parsVertexShader,
          )
          shader.vertexShader = shader.vertexShader.replace(
            'vec4 vertexPosition = texture(uPointPositionTexture, aUvPoint);',
            positionVertexShader,
          )

          this.#disablePointer()
        }
      }

      this.#rendererManager.compile()
    }
  }

  /**
   * Disable pointer
   *
   * @returns {void}
   */
  #disablePointer(): void {
    if (this.model.points) {
      this.model.points.material.uniforms.uPointer.value.set(
        -99999,
        -99999,
        -99999,
      )
    }
  }
}
