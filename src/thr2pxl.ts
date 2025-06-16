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
import FlowFieldManager from './core/app/model/gpgpu/flow-field-manager.js'
import Model from './core/app/model.js'
import Pointer from './core/app/pointer.js'
import App from './core/app.js'
import {Config, ModelSourceCamera} from './types'

export default class Thr2pxl {
  /**
   * @type {App}
   */
  #app: App

  /**
   * @type {Pointer}
   */
  #pointer: Pointer

  /**
   * @type {Model}
   */
  #model: Model

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
   * @param {{
   *            containerSelector?: string;
   *            model: {
   *              src: {
   *                highPoly: string;
   *                lowPoly: string;
   *              }
   *              width: number;
   *              height: number;
   *              camera?: {
   *                position?: {
   *                  x: number;
   *                  y: number;
   *                  z: number;
   *                }
   *                fov?: number;
   *                near?: number;
   *                far?: number;
   *                isControlsEnabled?: boolean;
   *              }
   *              point?: {
   *                size?: number;
   *                motion?: {
   *                  frequency?: number;
   *                  strength?: number;
   *                  strengthRatio?: number;
   *                  lifeDecay?: number;
   *                }
   *              }
   *            }
   *            loader?: {
   *              dracoUrl?: string;
   *            }
   *            pointer?: {
   *              strength?: number;
   *              minRad?: number;
   *              maxRad?: number;
   *              pulseStrength?: number;
   *              pulseFrequency?: number;
   *            }
   *            isDebugging?: boolean;
   *        }} config
   */
  constructor(config: Config) {
    this.#initTimer()
    this.#initModelLoaderManager(config.loader?.dracoUrl ?? null)
    this.#initRendererManager(
      config.model.width,
      config.model.height,
      config.containerSelector ?? null,
      config.model.camera ?? null,
    )
    this.#initModel(
      config.model.src.highPoly,
      config.model.point?.size,
      config.model.point?.motion?.frequency,
      config.model.point?.motion?.strength,
      config.model.point?.motion?.strengthRatio,
      config.model.point?.motion?.lifeDecay,
    )
    this.#initPointer(config.model.src.lowPoly)
    this.#initApp(
      config.pointer?.strength,
      config.pointer?.minRad,
      config.pointer?.maxRad,
      config.pointer?.pulseStrength,
      config.pointer?.pulseFrequency,
    )

    this.#render()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    cancelAnimationFrame(this.#requestAnimationId)

    this.#timer.dispose()
    this.#app.dispose()
    this.#rendererManager.dispose()
    this.#modelLoaderManager.dispose()
  }

  /**
   * Render
   *
   * @param   {number} t
   * @returns {void}
   */
  #render(t: number = 0): void {
    this.#timer.update(t)
    this.#app.update(this.#timer.getDelta(), this.#timer.getElapsed())
    this.#rendererManager.update(this.#timer.getDelta())
    this.#requestAnimationId = requestAnimationFrame(this.#render.bind(this))
  }

  /**
   * Init app
   *
   * @param   {number | undefined} pointerStrength
   * @param   {number | undefined} pointerMinRad
   * @param   {number | undefined} pointerMaxRad
   * @param   {number | undefined} pointerPulseStrength
   * @param   {number | undefined} pointerPulseFrequency
   * @returns {void}
   */
  #initApp(
    pointerStrength: number | undefined,
    pointerMinRad: number | undefined,
    pointerMaxRad: number | undefined,
    pointerPulseStrength: number | undefined,
    pointerPulseFrequency: number | undefined,
  ): void {
    this.#app = new App(
      this.#model,
      this.#pointer,
      this.#rendererManager,
      pointerStrength,
      pointerMinRad,
      pointerMaxRad,
      pointerPulseStrength,
      pointerPulseFrequency,
    )
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
  }

  /**
   * Init model
   *
   * @param   {string}             modelUrl
   * @param   {number | undefined} pointSize
   * @param   {number | undefined} flowFieldFrequency
   * @param   {number | undefined} flowFieldStrength
   * @param   {number | undefined} flowFieldStrengthRatio
   * @param   {number | undefined} flowFieldPointLifeDecay
   * @returns {void}
   */
  #initModel(
    modelUrl: string,
    pointSize: number | undefined,
    flowFieldFrequency: number | undefined,
    flowFieldStrength: number | undefined,
    flowFieldStrengthRatio: number | undefined,
    flowFieldPointLifeDecay: number | undefined,
  ): void {
    const gpGpuManager = new GpGpuManager(this.#rendererManager)
    const flowFieldManager = new FlowFieldManager(
      gpGpuManager,
      flowFieldFrequency,
      flowFieldStrength,
      flowFieldStrengthRatio,
      flowFieldPointLifeDecay,
    )

    this.#model = new Model(
      flowFieldManager,
      modelUrl,
      this.#modelLoaderManager,
      pointSize,
    )
  }

  /**
   * Init renderer manager
   *
   * @param   {number}        width
   * @param   {number}        height
   * @param   {string | null} containerSelector
   * @param   {{
   *            position?: {
   *              x: number;
   *              y: number;
   *              z: number;
   *            }
   *            fov?: number;
   *            near?: number;
   *            far?: number;
   *            isControlsEnabled?: boolean;
   *          } | null} camera
   * @returns {void}
   */
  #initRendererManager(
    width: number,
    height: number,
    containerSelector: string | null,
    camera: ModelSourceCamera | null,
  ): void {
    const cameraPosition = camera?.position
      ? new THREE.Vector3(
          camera.position.x,
          camera.position.y,
          camera.position.z,
        )
      : undefined
    this.#rendererManager = new RendererManager(
      width,
      height,
      cameraPosition,
      camera?.fov,
      camera?.near,
      camera?.far,
      camera?.isControlsEnabled,
    )

    if (containerSelector) {
      document
        .querySelector(containerSelector)
        ?.appendChild(this.#rendererManager.renderer.domElement)
    } else {
      document.body.appendChild(this.#rendererManager.renderer.domElement)
    }
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
