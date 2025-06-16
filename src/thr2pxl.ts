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
import DebugManager from './core/lib/debug-manager.js'
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
   * @type {DebugManager}
   */
  #debugManager: DebugManager

  /**
   * @type {number}
   */
  #requestAnimationId: number

  /**
   * Constructor
   *
   * @param {{
   *            containerSelector?: string;
   *            model             : {
   *              src: {
   *                highPoly: string;
   *                lowPoly : string;
   *              };
   *              width  : number;
   *              height : number;
   *              camera?: {
   *                position?: {
   *                  x: number;
   *                  y: number;
   *                  z: number;
   *                };
   *                fov              ?: number;
   *                near             ?: number;
   *                far              ?: number;
   *                isControlsEnabled?: boolean;
   *              };
   *              point?: {
   *                size  ?: number;
   *                motion?: {
   *                  frequency?: number;
   *                  strength ?: number;
   *                  ratio    ?: number;
   *                  lifeDecay?: number;
   *                }
   *              }
   *            };
   *            loader?: {
   *              dracoUrl?: string;
   *            };
   *            pointer?: {
   *              strength      ?: number;
   *              minRad        ?: number;
   *              maxRad        ?: number;
   *              pulseStrength ?: number;
   *              pulseFrequency?: number;
   *            };
   *            isDebugging?: boolean;
   *        }} config
   */
  constructor(config: Config) {
    this.#initDebugManager()
    this.#initTimer()
    this.#initModelLoaderManager(config.loader?.dracoUrl ?? null)
    this.#initRendererManager(
      config.model.width,
      config.model.height,
      config.containerSelector ?? null,
      config.model.camera ?? null,
    )
    this.#initApp(
      config.model.src.highPoly,
      config.model.src.lowPoly,
      config.model.point?.size,
      config.model.point?.motion?.frequency,
      config.model.point?.motion?.strength,
      config.model.point?.motion?.ratio,
      config.model.point?.motion?.lifeDecay,
      config.pointer?.strength,
      config.pointer?.minRad,
      config.pointer?.maxRad,
      config.pointer?.pulseStrength,
      config.pointer?.pulseFrequency,
    )

    this.#render()
  }

  /**
   * Enable debug mode
   *
   * @returns {void}
   */
  debug(): void {
    this.#app.debug()
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
    this.#debugManager.dispose()
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
   * @param   {string}             modelUrl
   * @param   {string}             lowPolyUrl
   * @param   {number | undefined} pointSize
   * @param   {number | undefined} flowFieldFrequency
   * @param   {number | undefined} flowFieldStrength
   * @param   {number | undefined} flowFieldRatio
   * @param   {number | undefined} flowFieldPointLifeDecay
   * @param   {number | undefined} pointerStrength
   * @param   {number | undefined} pointerMinRad
   * @param   {number | undefined} pointerMaxRad
   * @param   {number | undefined} pointerPulseStrength
   * @param   {number | undefined} pointerPulseFrequency
   * @returns {void}
   */
  #initApp(
    modelUrl: string,
    lowPolyUrl: string,
    pointSize: number | undefined,
    flowFieldFrequency: number | undefined,
    flowFieldStrength: number | undefined,
    flowFieldRatio: number | undefined,
    flowFieldPointLifeDecay: number | undefined,
    pointerStrength: number | undefined,
    pointerMinRad: number | undefined,
    pointerMaxRad: number | undefined,
    pointerPulseStrength: number | undefined,
    pointerPulseFrequency: number | undefined,
  ): void {
    const model = this.#initModel(
      modelUrl,
      pointSize,
      flowFieldFrequency,
      flowFieldStrength,
      flowFieldRatio,
      flowFieldPointLifeDecay,
    )

    const pointer = this.#initPointer(lowPolyUrl)

    this.#app = new App(
      model,
      pointer,
      this.#rendererManager,
      this.#debugManager,
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
   * @returns {Pointer}
   */
  #initPointer(lowPolyUrl: string): Pointer {
    return new Pointer(
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
   * @param   {number | undefined} flowFieldRatio
   * @param   {number | undefined} flowFieldPointLifeDecay
   * @returns {Model}
   */
  #initModel(
    modelUrl: string,
    pointSize: number | undefined,
    flowFieldFrequency: number | undefined,
    flowFieldStrength: number | undefined,
    flowFieldRatio: number | undefined,
    flowFieldPointLifeDecay: number | undefined,
  ): Model {
    const gpGpuManager = new GpGpuManager(this.#rendererManager)
    const flowFieldManager = new FlowFieldManager(
      gpGpuManager,
      this.#debugManager,
      flowFieldFrequency,
      flowFieldStrength,
      flowFieldRatio,
      flowFieldPointLifeDecay,
    )

    return new Model(
      flowFieldManager,
      this.#debugManager,
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
   *            };
   *            fov              ?: number;
   *            near             ?: number;
   *            far              ?: number;
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

  /**
   * Init debug manager
   *
   * @returns {void}
   */
  #initDebugManager(): void {
    this.#debugManager = new DebugManager()
  }
}
