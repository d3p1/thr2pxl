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
import ModelManager from './core/lib/model-manager.js'
import RendererManager from './core/lib/renderer-manager.js'
import GpGpuManager from './core/lib/gpgpu-manager.js'
import FlowFieldManager from './core/app/model/gpgpu/flow-field-manager.js'
import Model from './core/app/model.js'
import Pointer from './core/app/pointer.js'
import App from './core/app.js'
import {Config} from './types'

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
   * @type {ModelManager}
   */
  #modelManager: ModelManager

  /**
   * @type {Timer}
   */
  #timer: Timer

  /**
   * @type {DebugManager}
   */
  #debugManager: DebugManager

  /**
   * @type {{
   *   containerSelector?: string;
   *   models            : {
   *     src: {
   *       highPoly: string;
   *       lowPoly : string;
   *     };
   *     width  : number;
   *     height : number;
   *     camera?: {
   *       position?: {
   *         x: number;
   *         y: number;
   *         z: number;
   *       };
   *       fov              ?: number;
   *       near             ?: number;
   *       far              ?: number;
   *       isControlsEnabled?: boolean;
   *     };
   *     point?: {
   *       size  ?: number;
   *       motion?: {
   *         frequency?: number;
   *         strength ?: number;
   *         ratio    ?: number;
   *         lifeDecay?: number;
   *       }
   *     }
   *   };
   *   loader?: {
   *     dracoUrl?: string;
   *   };
   *   pointer?: {
   *     strength      ?: number;
   *     minRad        ?: number;
   *     maxRad        ?: number;
   *     pulseStrength ?: number;
   *     pulseFrequency?: number;
   *   };
   *   isDebugging?: boolean;
   * }}
   */
  #config: Config

  /**
   * @type {number}
   */
  #requestAnimationId: number

  /**
   * @type {boolean}
   */
  #isDebugging: boolean

  /**
   * @type {boolean}
   * @note By default, debug is not ready.
   *       That means that debug settings were not already created
   */
  #isDebugReady: boolean = false

  /**
   * @type {Function}
   */
  #boundHandleDebug: (e: KeyboardEvent) => void

  /**
   * @type {Function}
   */
  #boundHandleResize: (e: Event) => void

  /**
   * Constructor
   *
   * @param {{
   *            containerSelector?: string;
   *            models            : {
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
    this.#config = config
    this.#modelManager = new ModelManager(config.models)

    this.#init()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    cancelAnimationFrame(this.#requestAnimationId)

    window.removeEventListener('resize', this.#boundHandleResize)

    this.#timer.dispose()
    this.#app.dispose()
    this.#rendererManager.dispose()
    this.#modelLoaderManager.dispose()

    this.#disposeDebugManager()
  }

  /**
   * Init
   *
   * @returns {void}
   */
  #init(): void {
    this.#initDebugManager()
    this.#initTimer()
    this.#initModelLoaderManager()
    this.#initRendererManager()
    this.#initApp()

    this.#boundHandleResize = () => {
      if (this.#modelManager.update()) {
        this.dispose()
        this.#init()
      }
    }
    window.addEventListener('resize', this.#boundHandleResize)

    /**
     * @note If debugger is enabled by default,
     *       wait for model to be loaded to initialize it
     * @todo Improve this logic.
     *       It was implemented in this way to release faster
     */
    this.#render(this.#config.isDebugging ?? false)
  }

  /**
   * Render
   *
   * @param   {boolean} enableDebug
   * @param   {number}  t
   * @returns {void}
   */
  #render(enableDebug: boolean, t: number = 0): void {
    this.#timer.update(t)
    this.#app.update(this.#timer.getDelta(), this.#timer.getElapsed())
    this.#rendererManager.update(this.#timer.getDelta())

    /**
     * @note If debugger is enabled by default,
     *       wait for model to be loaded to initialize it.
     *       Then avoid trying to enable it again
     * @todo Improve this logic.
     *       It was implemented in this way to release faster
     */
    if (
      enableDebug &&
      this.#app.model.points &&
      this.#app.model.points.material.uniforms.uTime
    ) {
      this.#isDebugging = true
      this.#enableDebug()
      enableDebug = false
    }

    this.#requestAnimationId = requestAnimationFrame(
      this.#render.bind(this, enableDebug),
    )
  }

  /**
   * Handle debug
   *
   * @param   {KeyboardEvent} e
   * @returns {void}
   */
  #handleDebug(e: KeyboardEvent): void {
    if (e.key === 'd') {
      this.#isDebugging = !this.#isDebugging

      if (this.#isDebugging) {
        this.#enableDebug()
      } else {
        this.#disableDebug()
      }
    }
  }

  /**
   * Enable debug
   *
   * @returns {void}
   */
  #enableDebug(): void {
    /**
     * @note App debug settings should be enabled only once,
     *       to avoid duplicating them on every debug enable
     *       event
     * @todo Improve this logic.
     *       It was implemented in this way to release faster
     */
    if (!this.#isDebugReady) {
      this.#app.debug()
      this.#isDebugReady = true
    }

    this.#debugManager.enable()
  }

  /**
   * Disable debug
   *
   * @returns {void}
   */
  #disableDebug(): void {
    this.#debugManager.disable()
  }

  /**
   * Dispose debug manager
   *
   * @returns {void}
   */
  #disposeDebugManager(): void {
    window.removeEventListener('keydown', this.#boundHandleDebug)
    this.#debugManager.dispose()
  }

  /**
   * Init app
   *
   * @returns {void}
   */
  #initApp(): void {
    const model = this.#initModel()
    const pointer = this.#initPointer()
    this.#app = new App(
      model,
      pointer,
      this.#rendererManager,
      this.#debugManager,
      this.#config.pointer?.strength,
      this.#config.pointer?.minRad,
      this.#config.pointer?.maxRad,
      this.#config.pointer?.pulseStrength,
      this.#config.pointer?.pulseFrequency,
    )
  }

  /**
   * Init pointer
   *
   * @returns {Pointer}
   */
  #initPointer(): Pointer {
    return new Pointer(
      this.#rendererManager,
      this.#modelManager.currentModel.src.lowPoly,
      this.#modelLoaderManager,
    )
  }

  /**
   * Init model
   *
   * @returns {Model}
   */
  #initModel(): Model {
    const gpGpuManager = new GpGpuManager(this.#rendererManager)
    const flowFieldManager = new FlowFieldManager(
      gpGpuManager,
      this.#debugManager,
      this.#modelManager.currentModel.point?.motion?.frequency,
      this.#modelManager.currentModel.point?.motion?.strength,
      this.#modelManager.currentModel.point?.motion?.ratio,
      this.#modelManager.currentModel.point?.motion?.lifeDecay,
    )

    return new Model(
      flowFieldManager,
      this.#debugManager,
      this.#modelManager.currentModel.src.highPoly,
      this.#modelLoaderManager,
      this.#modelManager.currentModel.point?.size,
    )
  }

  /**
   * Init renderer manager
   *
   * @returns {void}
   */
  #initRendererManager(): void {
    const cameraPosition = this.#modelManager.currentModel.camera?.position
      ? new THREE.Vector3(
          this.#modelManager.currentModel.camera.position.x,
          this.#modelManager.currentModel.camera.position.y,
          this.#modelManager.currentModel.camera.position.z,
        )
      : undefined
    this.#rendererManager = new RendererManager(
      this.#modelManager.currentModel.width,
      this.#modelManager.currentModel.height,
      cameraPosition,
      this.#modelManager.currentModel.camera?.fov,
      this.#modelManager.currentModel.camera?.near,
      this.#modelManager.currentModel.camera?.far,
      this.#modelManager.currentModel.camera?.isControlsEnabled,
    )

    if (this.#config.containerSelector) {
      document
        .querySelector(this.#config.containerSelector)
        ?.appendChild(this.#rendererManager.renderer.domElement)
    } else {
      document.body.appendChild(this.#rendererManager.renderer.domElement)
    }
  }

  /**
   * Init model loader manager
   *
   * @returns {void}
   */
  #initModelLoaderManager(): void {
    this.#modelLoaderManager = new ModelLoaderManager(
      this.#config.loader?.dracoUrl,
    )
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
   * @note    Disable debug feature by default
   */
  #initDebugManager(): void {
    this.#debugManager = new DebugManager()
    this.#debugManager.disable()
    this.#isDebugging = false

    this.#boundHandleDebug = this.#handleDebug.bind(this)
    document.addEventListener('keydown', this.#boundHandleDebug)

    if (this.#config.containerSelector) {
      document
        .querySelector(this.#config.containerSelector)
        ?.appendChild(this.#debugManager.debugger.element)
    }
  }
}
