/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        This class works as the entry point of the library.
 *              It is like a dependency injection manager (DI container).
 *              Also, it adds features not related to the app/effect itself,
 *              like enable debug to tweak app/effect parameters or
 *              effect parent container configuration
 */
import {Pane} from 'tweakpane'
import * as THREE from 'three'
import {Timer} from 'three/examples/jsm/misc/Timer.js'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import RendererManager from './core/lib/renderer-manager.js'
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
  #model: THREE.Mesh

  /**
   * @type {GPUComputationRenderer}
   */
  #gpgpu: GPUComputationRenderer

  /**
   * @type {Variable}
   */
  #gpgpuPointVar: Variable

  /**
   * @type {Pointer | null}
   */
  #pointer: Pointer | null = null

  /**
   * @type {THREE.Mesh}
   */
  #raycasterMesh: THREE.Mesh

  /**
   * @type {GLTFLoader}
   */
  #gltfLoader: GLTFLoader

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
    this.#initGltfLoader()
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
  }

  /**
   * Animate
   *
   * @param   {number} t
   * @returns {void}
   */
  #animate(t: number = 0): void {
    if (this.#gpgpu) {
      this.#timer.update(t)

      this.#gpgpuPointVar.material.uniforms.uTime.value =
        this.#timer.getElapsed()
      this.#gpgpuPointVar.material.uniforms.uDeltaTime.value =
        this.#timer.getDelta()

      this.#gpgpu.compute()
      const fbo = this.#gpgpu.getCurrentRenderTarget(
        this.#gpgpuPointVar,
      ).texture
      const material = this.#points.material as THREE.ShaderMaterial
      material.uniforms.uPointPositionTexture.value = fbo
      material.uniforms.uTime.value = this.#timer.getElapsed()

      if (this.#pointer && this.#pointer.intersections?.length) {
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

    const {
      uFlowFieldChangeFrequency,
      uFlowFieldStrength,
      uFlowFieldStrengthRatio,
      uParticleLifeDecay,
    } = this.#gpgpuPointVar.material.uniforms

    const pointMaterial = this.#points.material as THREE.ShaderMaterial
    const {
      uCursorMinRad,
      uCursorMaxRad,
      uCursorStrength,
      uCursorBreatheStrength,
      uCursorBreatheFrequency,
    } = pointMaterial.uniforms

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
    this.#gltfLoader.load(
      '/thr2pxl/media/models/ship.simplified.glb',
      (model) => {
        const mesh = model.scene.children[0] as THREE.Mesh

        if (mesh) {
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
        }

        this.#pointer = new Pointer(this.#raycasterMesh, this.#rendererManager)
      },
    )
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
      this.#model.geometry.attributes.position.count,
    )

    /**
     * @todo Analyze if the uv should be generated using the points or the
     *       texture
     */
    const vertices = this.#model.geometry.attributes.position.count
    const randomSizeArray = new Float32Array(vertices)
    const uvArray = new Float32Array(vertices * 2)
    const renderTarget = this.#gpgpu.getCurrentRenderTarget(this.#gpgpuPointVar)
    const width = renderTarget.width
    const height = renderTarget.height

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
      this.#model.geometry.attributes.color,
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
    const vertices = this.#model.geometry.attributes.position.count
    const size = Math.ceil(Math.sqrt(vertices))

    this.#gpgpu = new GPUComputationRenderer(
      size,
      size,
      this.#rendererManager.renderer,
    )

    const texture = this.#gpgpu.createTexture()
    for (let i = 0; i < vertices; i++) {
      const i3 = i * 3
      const i4 = i * 4
      const data = texture.image.data as Float32Array
      const position = this.#model.geometry.attributes.position.array

      data[i4 + 0] = position[i3 + 0]
      data[i4 + 1] = position[i3 + 1]
      data[i4 + 2] = position[i3 + 2]
      data[i4 + 3] = Math.random()
    }

    this.#gpgpuPointVar = this.#gpgpu.addVariable(
      'texturePoint',
      gpGpuFragmentShader,
      texture,
    )
    this.#gpgpu.setVariableDependencies(this.#gpgpuPointVar, [
      this.#gpgpuPointVar,
    ])

    this.#gpgpuPointVar.material.uniforms.uTime = new THREE.Uniform(0)
    this.#gpgpuPointVar.material.uniforms.uDeltaTime = new THREE.Uniform(0)
    this.#gpgpuPointVar.material.uniforms.uBasePosition = new THREE.Uniform(
      texture,
    )
    this.#gpgpuPointVar.material.uniforms.uFlowFieldChangeFrequency =
      new THREE.Uniform(0.1)
    this.#gpgpuPointVar.material.uniforms.uFlowFieldStrength =
      new THREE.Uniform(3)
    this.#gpgpuPointVar.material.uniforms.uFlowFieldStrengthRatio =
      new THREE.Uniform(0.25)
    this.#gpgpuPointVar.material.uniforms.uParticleLifeDecay =
      new THREE.Uniform(0.01)

    const error = this.#gpgpu.init()
    if (error !== null) {
      console.error(error)
    }
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
    this.#gltfLoader.load('/thr2pxl/media/models/ship.glb', (model: GLTF) => {
      this.#model = model.scene.children[0] as THREE.Mesh
      this.#initGpGpu()
      this.#initPoints()
      this.#initRaycaster()
      this.#initDebugger()
    })
  }

  /**
   * Init GLTF loader
   *
   * @returns {void}
   */
  #initGltfLoader(): void {
    this.#gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/thr2pxl/js/draco/')
    this.#gltfLoader.setDRACOLoader(dracoLoader)
  }
}
new Main()
