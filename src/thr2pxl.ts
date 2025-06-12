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
import {Timer} from 'three/examples/jsm/misc/Timer.js'
import RendererManager from './core/lib/renderer-manager.js'
import ModelLoaderManager from './core/lib/model-loader-manager.ts'
import GpGpuManager from './core/lib/gpgpu-manager.ts'
import Model from './core/app/model.ts'
import Pointer from './core/app/pointer.ts'
import gpGpuFragmentShader from './core/app/shader/gpgpu/fragment.glsl'

export default class Thr2pxl {
  /**
   * @type {THREE.Mesh}
   */
  #mesh: THREE.Mesh

  /**
   * @type {Model}
   */
  #model: Model

  /**
   * @type {Pointer | null}
   */
  #pointer: Pointer | null = null

  /**
   * @type {THREE.Mesh | null}
   */
  #raycasterMesh: THREE.Mesh | null = null

  /**
   * @type {GpGpuManager | null}
   */
  #gpGpuManager: GpGpuManager | null = null

  /**
   * @type {ModelLoaderManager}
   */
  #modelLoaderManager: ModelLoaderManager

  /**
   * @type {RendererManager}
   */
  #rendererManager: RendererManager

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
   * @param {string}        raycasterModelUrl
   * @param {string | null} dracoUrl
   * @todo  Improve param names
   */
  constructor(
    modelUrl: string,
    raycasterModelUrl: string,
    dracoUrl: string | null = null,
  ) {
    this.#initModelLoaderManager(dracoUrl)
    this.#initModels(modelUrl, raycasterModelUrl)
    this.#initTimer()
    this.#initRenderer()

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
    this.#gpGpuManager?.dispose()
    this.#modelLoaderManager.dispose()
  }

  /**
   * Animate
   *
   * @param   {number} t
   * @returns {void}
   */
  #animate(t: number = 0): void {
    if (this.#gpGpuManager) {
      this.#timer.update(t)

      this.#gpGpuManager.update(
        this.#timer.getDelta(),
        this.#timer.getElapsed(),
      )

      if (this.#model) {
        this.#model.update(this.#timer.getElapsed())

        const material = this.#model.points.material as THREE.ShaderMaterial
        const fbo = this.#gpGpuManager.getCurrentFbo()
        if (fbo) {
          material.uniforms.uPointPositionTexture.value = fbo.texture
        }

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

    if (this.#gpGpuManager) {
      const {
        uFlowFieldChangeFrequency,
        uFlowFieldStrength,
        uFlowFieldStrengthRatio,
        uParticleLifeDecay,
      } = this.#gpGpuManager.gpGpuVar.material.uniforms

      this.#debugger.addBinding(uFlowFieldChangeFrequency, 'value', {
        min: 0,
        max: 0.25,
        step: 0.01,
        label: 'uFlowFieldChangeFrequency',
      })

      this.#debugger.addBinding(uFlowFieldStrength, 'value', {
        min: 0,
        max: 5,
        step: 0.01,
        label: 'uFlowFieldStrength',
      })

      this.#debugger.addBinding(uFlowFieldStrengthRatio, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'uFlowFieldStrengthRatio',
      })

      this.#debugger.addBinding(uParticleLifeDecay, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'uParticleLifeDecay',
      })
    }

    const pointMaterial = this.#model.points.material as THREE.ShaderMaterial
    const {
      uCursorMinRad,
      uCursorMaxRad,
      uCursorStrength,
      uCursorBreatheStrength,
      uCursorBreatheFrequency,
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

    this.#debugger.addBinding(uCursorBreatheStrength, 'value', {
      min: 0,
      max: 2,
      step: 0.01,
      label: 'uCursorBreatheStrength',
    })

    this.#debugger.addBinding(uCursorBreatheFrequency, 'value', {
      min: 0,
      max: 5,
      step: 0.01,
      label: 'uCursorBreatheFrequency',
    })
  }

  /**
   * Init raycaster
   *
   * @param   {string} raycasterModelUrl
   * @returns {void}
   * @todo    Improve param names
   */
  #initRaycaster(raycasterModelUrl: string): void {
    this.#modelLoaderManager
      .loadMeshFromModel(raycasterModelUrl)
      .then((mesh) => {
        this.#raycasterMesh = new THREE.Mesh(
          mesh.geometry.clone(),
          new THREE.MeshBasicMaterial({wireframe: true}),
        )

        this.#raycasterMesh.position.set(
          this.#model.points.position.x,
          this.#model.points.position.y,
          this.#model.points.position.z,
        )
        this.#raycasterMesh.visible = false
        this.#rendererManager.scene.add(this.#raycasterMesh)

        this.#pointer = new Pointer(this.#raycasterMesh, this.#rendererManager)
      })
  }

  /**
   * Init points
   *
   * @returns {void}
   */
  #initPoints(): void {
    const position = this.#mesh.geometry.attributes
      .position as THREE.BufferAttribute
    const color = this.#mesh.geometry.attributes.color as THREE.BufferAttribute
    this.#model = new Model(position, color, this.#gpGpuManager as GpGpuManager)

    this.#rendererManager.scene.add(this.#model.points)
  }

  /**
   * Init GPGPU
   *
   * @returns {void}
   */
  #initGpGpu(): void {
    const vertices = this.#mesh.geometry.attributes.position.count
    const position = this.#mesh.geometry.attributes.position.array
    const texelData = new Float32Array(vertices * 4)

    for (let i = 0; i < vertices; i++) {
      const i3 = i * 3
      const i4 = i * 4

      texelData[i4 + 0] = position[i3 + 0]
      texelData[i4 + 1] = position[i3 + 1]
      texelData[i4 + 2] = position[i3 + 2]
      texelData[i4 + 3] = Math.random()
    }

    this.#gpGpuManager = new GpGpuManager(
      texelData,
      gpGpuFragmentShader,
      this.#rendererManager,
    )

    this.#gpGpuManager.gpGpuVar.material.uniforms.uFlowFieldChangeFrequency =
      new THREE.Uniform(0.1)
    this.#gpGpuManager.gpGpuVar.material.uniforms.uFlowFieldStrength =
      new THREE.Uniform(3)
    this.#gpGpuManager.gpGpuVar.material.uniforms.uFlowFieldStrengthRatio =
      new THREE.Uniform(0.25)
    this.#gpGpuManager.gpGpuVar.material.uniforms.uParticleLifeDecay =
      new THREE.Uniform(0.01)
  }

  /**
   * Init renderer
   *
   * @returns {void}
   */
  #initRenderer(): void {
    this.#rendererManager = new RendererManager(
      window.innerWidth,
      window.innerHeight,
      new THREE.Vector3(5, 0, 10),
    )

    document.body.appendChild(this.#rendererManager.renderer.domElement)
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
   * @param   {string} raycasterModelUrl
   * @returns {void}
   * @todo    Improve param names
   */
  #initModels(modelUrl: string, raycasterModelUrl: string): void {
    this.#modelLoaderManager.loadMeshFromModel(modelUrl).then((mesh) => {
      this.#mesh = mesh
      this.#initGpGpu()
      this.#initPoints()
      this.#initRaycaster(raycasterModelUrl)
      this.#initDebugger()
    })
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
