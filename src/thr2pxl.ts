/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class works as the entry point of the library.
 *              It is like a dependency injection manager (DI container).
 *              Also, it adds features not related to the app/effect itself,
 *              like enable debug to tweak app/effect parameters
 */
import * as THREE from 'three'
import {Timer} from 'three/addons/misc/Timer.js'
import ModelLoaderManager from './core/lib/model-loader-manager.js'
import RendererManager from './core/lib/renderer-manager.js'
import GpGpuManager from './core/lib/gpgpu-manager.js'
import Pointer from './core/app/pointer.js'
import Model from './core/app/model.js'

export default class Thr2pxl {
  /**
   * @type {Model}
   */
  #model: Model

  /**
   * @type {Pointer}
   */
  #pointer: Pointer

  /**
   * @type {GpGpuManager}
   */
  #gpGpuManager: GpGpuManager

  /**
   * @type {RendererManager}
   */
  #rendererManager: RendererManager

  /**
   * @type {ModelLoaderManager}
   */
  #modelLoaderManager: ModelLoaderManager

  /**
   * @type {Timer}
   */
  #timer: Timer

  /**
   * @type {number}
   */
  #requestAnimationId: number

  /**
   * Constructor
   *
   * @param {string}        modelUrl
   * @param {string}        lowPolyModelUrl
   * @param {string | null} dracoUrl
   * @todo  Add config object as param with related type
   */
  constructor(
    modelUrl: string,
    lowPolyModelUrl: string,
    dracoUrl: string | null = null,
  ) {
    this.#initTimer()
    this.#initModelLoaderManager(dracoUrl)
    this.#initRendererManager()
    this.#initGpGpuManager()
    this.#initModel(modelUrl)
    this.#initPointer(lowPolyModelUrl)

    this.#animate()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    cancelAnimationFrame(this.#requestAnimationId)

    if (this.#pointer) {
      this.#pointer.dispose()
    }

    if (this.#model) {
      this.#model.dispose()
    }

    this.#rendererManager.dispose()
    this.#modelLoaderManager.dispose()
  }

  /**
   * Animate
   *
   * @param   {number} t
   * @returns {void}
   */
  #animate(t: number = 0): void {
    this.#timer.update(t)

    if (this.#model.points) {
      this.#model.update(this.#timer.getDelta(), this.#timer.getElapsed())

      if (this.#pointer && this.#pointer.intersections.length) {
        this.#model.points.material.uniforms.uCursor.value.set(
          ...this.#pointer.intersections[0].point,
        )
      } else {
        /**
         * @todo Improve `uCursor` default value
         */
        this.#model.points.material.uniforms.uCursor.value.set(
          -99999,
          -99999,
          -99999,
        )
      }

      this.#rendererManager.update(this.#timer.getDelta())
    }

    this.#requestAnimationId = requestAnimationFrame(this.#animate.bind(this))
  }

  /**
   * Init pointer
   *
   * @param   {string} lowPolyUrl
   * @returns {void}
   */
  #initPointer(lowPolyUrl: string): void {
    this.#pointer = new Pointer(
      this.#rendererManager,
      lowPolyUrl,
      this.#modelLoaderManager,
    )

    /**
     * @todo Sync with model position
     */
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
   * @param   {string} modelUrl
   * @returns {void}
   */
  #initModel(modelUrl: string): void {
    this.#model = new Model(
      this.#gpGpuManager,
      modelUrl,
      this.#modelLoaderManager,
    )
    this.#model.load().then(() => {
      if (this.#model.points) {
        this.#model.points.position.set(0, 0, 0)
        this.#rendererManager.scene.add(this.#model.points)
      }
    })
  }

  /**
   * Init GPGPU manager
   *
   * @returns {void}
   */
  #initGpGpuManager(): void {
    this.#gpGpuManager = new GpGpuManager(this.#rendererManager)
  }

  /**
   * Init renderer manager
   *
   * @returns {void}
   */
  #initRendererManager(): void {
    this.#rendererManager = new RendererManager(
      window.innerWidth,
      window.innerHeight,
      new THREE.Vector3(5, 0, 10),
    )

    document.body.appendChild(this.#rendererManager.renderer.domElement)
  }

  /**
   * Init model loader manager
   *
   * @param   {string | null} dracoUrl
   * @returns {void}
   */
  #initModelLoaderManager(dracoUrl: string | null): void {
    this.#modelLoaderManager = new ModelLoaderManager(dracoUrl)
  }

  /**
   * Init timer
   *
   * @returns {void}
   */
  #initTimer(): void {
    this.#timer = new Timer()
  }
}
