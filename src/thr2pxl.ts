/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class works as the entry point of the library.
 *              It is like a dependency injection manager (DI container).
 *              Also, it adds features not related to the app/effect itself,
 *              like enable debug to tweak app/effect parameters
 */
import {Pane} from 'tweakpane'
import * as THREE from 'three'
import {Timer} from 'three/addons/misc/Timer.js'
import RendererManager from './core/lib/renderer-manager.js'
import ModelLoaderManager from './core/lib/model-loader-manager.ts'
import GpGpuManager from './core/lib/gpgpu-manager.ts'
import Pointer from './core/app/pointer.ts'
import Model from './core/app/model.ts'

export default class Thr2pxl {
  /**
   * @type {THREE.Mesh | null}
   */
  #mesh: THREE.Mesh | null = null

  /**
   * @type {Model}
   */
  #model: Model | null = null

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
   * @type {Pane}
   */
  #debugger: Pane

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
    this.#initModelLoaderManager(dracoUrl)
    this.#initRendererManager()
    this.#initGpGpuManager()
    this.#initModels(modelUrl, lowPolyModelUrl)
    this.#initTimer()

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

    if (this.#model) {
      this.#model.update(this.#timer.getDelta(), this.#timer.getElapsed())

      const material = this.#model.points.material as THREE.ShaderMaterial
      if (this.#pointer && this.#pointer.intersections.length) {
        material.uniforms.uCursor.value.set(
          ...this.#pointer.intersections[0].point,
        )
      } else {
        /**
         * @todo Improve `uCursor` default value
         */
        material.uniforms.uCursor.value.set(-99999, -99999, -99999)
      }

      this.#rendererManager.update(this.#timer.getDelta())
    }

    this.#requestAnimationId = requestAnimationFrame(this.#animate.bind(this))
  }

  /**
   * Init debugger
   *
   * @returns {void}
   */
  #initDebugger(): void {
    this.#debugger = new Pane()

    // if (this.#gpGpuManager && this.#gpGpuVar) {
    //   const {
    //     uFlowFieldChangeFrequency,
    //     uFlowFieldStrength,
    //     uFlowFieldStrengthRatio,
    //     uParticleLifeDecay,
    //   } = this.#gpGpuVar.material.uniforms
    //
    //   this.#debugger.addBinding(uFlowFieldChangeFrequency, 'value', {
    //     min: 0,
    //     max: 0.25,
    //     step: 0.01,
    //     label: 'uFlowFieldChangeFrequency',
    //   })
    //
    //   this.#debugger.addBinding(uFlowFieldStrength, 'value', {
    //     min: 0,
    //     max: 5,
    //     step: 0.01,
    //     label: 'uFlowFieldStrength',
    //   })
    //
    //   this.#debugger.addBinding(uFlowFieldStrengthRatio, 'value', {
    //     min: 0,
    //     max: 1,
    //     step: 0.01,
    //     label: 'uFlowFieldStrengthRatio',
    //   })
    //
    //   this.#debugger.addBinding(uParticleLifeDecay, 'value', {
    //     min: 0,
    //     max: 1,
    //     step: 0.01,
    //     label: 'uParticleLifeDecay',
    //   })
    // }

    if (this.#model) {
      const pointMaterial = this.#model.points.material as THREE.ShaderMaterial
      const {
        uCursorMinRad,
        uCursorMaxRad,
        uCursorStrength,
        uCursorPulseStrength,
        uCursorPulseFrequency,
      } = pointMaterial.uniforms

      this.#debugger.addBinding(uCursorMinRad, 'value', {
        min: 0.01,
        max: 5,
        step: 0.01,
        label: 'uCursorMinRad',
      })

      this.#debugger.addBinding(uCursorMaxRad, 'value', {
        min: 0.02,
        max: 10,
        step: 0.01,
        label: 'uCursorMaxRad',
      })

      this.#debugger.addBinding(uCursorStrength, 'value', {
        min: 0,
        max: 5,
        step: 0.01,
        label: 'uCursorStrength',
      })

      this.#debugger.addBinding(uCursorPulseStrength, 'value', {
        min: 0,
        max: 2,
        step: 0.01,
        label: 'uCursorPulseStrength',
      })

      this.#debugger.addBinding(uCursorPulseFrequency, 'value', {
        min: 0,
        max: 5,
        step: 0.01,
        label: 'uCursorPulseFrequency',
      })
    }
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

    this.#pointer.load().then(() => {
      if (this.#pointer.mesh) {
        this.#pointer.mesh.position.set(
          this.#model?.points.position.x ?? 0,
          this.#model?.points.position.y ?? 0,
          this.#model?.points.position.z ?? 0,
        )
        this.#pointer.mesh.visible = false
        this.#rendererManager.scene.add(this.#pointer.mesh)
      }
    })
  }

  /**
   * Init points
   *
   * @returns {void}
   */
  #initPoints(): void {
    const position = this.#mesh?.geometry.attributes
      .position as THREE.BufferAttribute
    const color = this.#mesh?.geometry.attributes.color as THREE.BufferAttribute
    this.#model = new Model(position, color, this.#gpGpuManager as GpGpuManager)

    this.#rendererManager.scene.add(this.#model.points)
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
   * Init models
   *
   * @param   {string} modelUrl
   * @param   {string} lowPolyModelUrl
   * @returns {void}
   */
  #initModels(modelUrl: string, lowPolyModelUrl: string): void {
    this.#modelLoaderManager.loadMeshFromModel(modelUrl).then((mesh) => {
      this.#mesh = mesh
      this.#initPoints()
      this.#initPointer(lowPolyModelUrl)
      this.#initDebugger()
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
}
