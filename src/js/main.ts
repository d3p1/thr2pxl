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
import Pointer from './core/app/pointer.ts'
import vertexShader from './shader/particle/vertex.glsl'
import fragmentShader from './shader/particle/fragment.glsl'
import gpGpuFragmentShader from './shader/gpgpu/fragment.glsl'

class Main {
  /**
   * @type {THREE.Points}
   */
  #points: THREE.Points

  /**
   * @type {THREE.Mesh}
   */
  #mesh: THREE.Mesh

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
   */
  constructor() {
    this.#initModelLoaderManager()
    this.#initModel()
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

      const material = this.#points.material as THREE.ShaderMaterial
      const fbo = this.#gpGpuManager.getCurrentFbo()
      if (fbo) {
        material.uniforms.uPointPositionTexture.value = fbo.texture
      }
      material.uniforms.uTime.value = this.#timer.getElapsed()

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

    const pointMaterial = this.#points.material as THREE.ShaderMaterial
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
   * @returns {void}
   */
  #initRaycaster(): void {
    this.#modelLoaderManager
      .loadMeshFromModel('/thr2pxl/media/models/ship.simplified.glb')
      .then((mesh) => {
        this.#raycasterMesh = new THREE.Mesh(
          mesh.geometry.clone(),
          new THREE.MeshBasicMaterial({wireframe: true}),
        )

        this.#raycasterMesh.position.set(
          this.#points.position.x,
          this.#points.position.y,
          this.#points.position.z,
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
   * @todo    Improve default value for `uCursor`
   */
  #initPoints(): void {
    this.#points = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uPointSize: new THREE.Uniform(5),
          uPointPositionTexture: new THREE.Uniform(null),
          uCursor: new THREE.Uniform(new THREE.Vector3(-99999, -99999, -99999)),
          uCursorStrength: new THREE.Uniform(0.3),
          uCursorBreatheStrength: new THREE.Uniform(0.2),
          uCursorBreatheFrequency: new THREE.Uniform(1),
          uCursorMinRad: new THREE.Uniform(0.5),
          uCursorMaxRad: new THREE.Uniform(2),
          uTime: new THREE.Uniform(null),
        },
      }),
    )

    this.#points.geometry.setDrawRange(
      0,
      this.#mesh.geometry.attributes.position.count,
    )

    /**
     * @todo Analyze if the uv should be generated using the points or the
     *       texture
     */
    const vertices = this.#mesh.geometry.attributes.position.count
    const randomSizeArray = new Float32Array(vertices)
    const uvArray = new Float32Array(vertices * 2)
    const renderTarget = this.#gpGpuManager?.getCurrentFbo()
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
    this.#points.geometry.setAttribute(
      'aUvPoint',
      new THREE.BufferAttribute(uvArray, 2),
    )
    this.#points.geometry.setAttribute(
      'aColor',
      this.#mesh.geometry.attributes.color,
    )
    this.#points.geometry.setAttribute(
      'aPointSize',
      new THREE.BufferAttribute(randomSizeArray, 1),
    )

    this.#rendererManager.scene.add(this.#points)
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
   * Init model
   *
   * @returns {void}
   */
  #initModel(): void {
    this.#modelLoaderManager
      .loadMeshFromModel('/thr2pxl/media/models/ship.glb')
      .then((mesh) => {
        this.#mesh = mesh
        this.#initGpGpu()
        this.#initPoints()
        this.#initRaycaster()
        this.#initDebugger()
      })
  }

  /**
   * Init model loader manager
   *
   * @returns {void}
   */
  #initModelLoaderManager(): void {
    this.#modelLoaderManager = new ModelLoaderManager('/thr2pxl/js/draco/')
  }
}
new Main()
