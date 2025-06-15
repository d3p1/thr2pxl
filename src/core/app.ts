/**
 * @description App
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class will manage how the renderer manager,
 *              debug manager, the image, the pointer
 *              and the motion (i.e.: flow field)
 *              interact between each other
 */
import * as THREE from 'three'
import RendererManager from './lib/renderer-manager.js'
import Pointer from './app/pointer.js'
import Model from './app/model.js'
import parsVertexShader from './app/shader/pars_vertex.glsl'
import positionVertexShader from './app/shader/position_vertex.glsl'

export default class App {
  /**
   * @type {Model}
   */
  readonly #model: Model

  /**
   * @type {Pointer}
   */
  readonly #pointer: Pointer

  /**
   * @type {RendererManager}
   */
  readonly #rendererManager: RendererManager

  /**
   * Constructor
   *
   * @param {Model}           model
   * @param {Pointer}         pointer
   * @param {RendererManager} rendererManager
   */
  constructor(
    model: Model,
    pointer: Pointer,
    rendererManager: RendererManager,
  ) {
    this.#model = model
    this.#pointer = pointer
    this.#rendererManager = rendererManager

    this.#initPointer()
    this.#initModel()
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
    if (this.#model.points && this.#model.points.material.uniforms.uTime) {
      this.#model.update(deltaTime, elapsedTime)

      this.#model.points.material.uniforms.uTime.value = elapsedTime

      if (this.#pointer && this.#pointer.intersections.length) {
        this.#model.points.material.uniforms.uPointer.value.set(
          ...this.#pointer.intersections[0].point,
        )
      } else {
        this.#disablePointer()
      }
    }
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.#pointer.dispose()
    this.#model.dispose()
  }

  /**
   * Init pointer
   *
   * @returns {void}
   * @note    Set low poly model (raycaster model) at the center of the scene
   *          (the same position used for the model)
   * @note    Add pointer effect to model
   */
  #initPointer(): void {
    this.#pointer.load().then(() => {
      if (this.#pointer.mesh) {
        this.#pointer.mesh.position.set(0, 0, 0)
        this.#pointer.mesh.visible = false
        this.#rendererManager.scene.add(this.#pointer.mesh)
      }
    })
  }

  /**
   * Init model
   *
   * @returns {void}
   * @note    Set model at the center of the scene
   */
  #initModel(): void {
    this.#model.load().then(() => {
      if (this.#model.points) {
        this.#addPointerHandlerToModel()

        this.#model.points.position.set(0, 0, 0)
        this.#rendererManager.scene.add(this.#model.points)
      }
    })
  }

  /**
   * Add pointer handler to model
   *
   * @returns {void}
   * @note    Force shader compilation with `compile()`.
   *          If it is not forced the shader compilation, then
   *          uniforms will be undefined until first render of the scene
   * {@link   https://github.com/mrdoob/three.js/pull/10960}
   */
  #addPointerHandlerToModel(): void {
    if (this.#model.points) {
      this.#model.points.material.onBeforeCompile = (shader) => {
        if (this.#model.points) {
          this.#model.points.material.uniforms.uPointer = new THREE.Uniform(
            new THREE.Vector3(),
          )
          this.#model.points.material.uniforms.uPointerStrength =
            new THREE.Uniform(0.3)
          this.#model.points.material.uniforms.uPointerPulseStrength =
            new THREE.Uniform(0.2)
          this.#model.points.material.uniforms.uPointerPulseFrequency =
            new THREE.Uniform(1)
          this.#model.points.material.uniforms.uPointerMinRad =
            new THREE.Uniform(0.5)
          this.#model.points.material.uniforms.uPointerMaxRad =
            new THREE.Uniform(2)
          this.#model.points.material.uniforms.uTime = new THREE.Uniform(0)

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
    if (this.#model.points) {
      this.#model.points.material.uniforms.uPointer.value.set(
        -99999,
        -99999,
        -99999,
      )
    }
  }
}
