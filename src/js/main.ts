/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import {ShaderMaterial} from 'three'
import * as THREE from 'three'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import vertexShader from './shader/particle/vertex.glsl'
import fragmentShader from './shader/particle/fragment.glsl'
import gpGpufragmentShader from './shader/gpgpu/fragment.glsl'

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
   * @type {OrbitControls}
   */
  #controls: OrbitControls

  /**
   * @type {THREE.WebGLRenderer}
   */
  #renderer: THREE.WebGLRenderer

  /**
   * @type {THREE.PerspectiveCamera}
   */
  #camera: THREE.PerspectiveCamera

  /**
   * @type {THREE.Scene}
   */
  #scene: THREE.Scene

  /**
   * Constructor
   */
  constructor() {
    this.#initModel()
    this.#initScene()
    this.#initCamera()
    this.#initRenderer()
    this.#initControls()

    this.#animate()
  }

  /**
   * Animate
   *
   * @returns {void}
   */
  #animate(): void {
    if (this.#gpgpu) {
      this.#controls.update()

      this.#gpgpu.compute()
      const fbo = this.#gpgpu.getCurrentRenderTarget(
        this.#gpgpuPointVar,
      ).texture
      const material = this.#points.material as ShaderMaterial
      material.uniforms.uPointPositionTexture.value = fbo

      this.#renderer.render(this.#scene, this.#camera)
    }

    requestAnimationFrame(this.#animate.bind(this))
  }

  /**
   * Resize renderer
   *
   * @returns {void}
   */
  #resizeRenderer(): void {
    this.#camera.aspect = window.innerWidth / window.innerHeight
    this.#camera.updateProjectionMatrix()

    this.#renderer.setSize(window.innerWidth, window.innerHeight)
    this.#renderer.setPixelRatio(this.#getPixelRatio())
  }

  /**
   * Init points
   *
   * @returns {void}
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
    const uvArray = new Float32Array(
      this.#model.geometry.attributes.position.count * 2,
    )
    const renderTarget = this.#gpgpu.getCurrentRenderTarget(this.#gpgpuPointVar)
    const width = renderTarget.width
    const height = renderTarget.height

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 2

        uvArray[i + 0] = (x + 0.5) / width
        uvArray[i + 1] = (y + 0.5) / height
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

    this.#scene.add(this.#points)
  }

  /**
   * Init GPGPU
   *
   * @returns {void}
   */
  #initGpGpu(): void {
    const vertices = this.#model.geometry.attributes.position.count
    const size = Math.ceil(Math.sqrt(vertices))

    this.#gpgpu = new GPUComputationRenderer(size, size, this.#renderer)

    const texture = this.#gpgpu.createTexture()
    for (let i = 0; i < vertices; i++) {
      const i3 = i * 3
      const i4 = i * 4
      const data = texture.image.data as Float32Array
      const position = this.#model.geometry.attributes.position.array

      data[i4 + 0] = position[i3 + 0]
      data[i4 + 1] = position[i3 + 1]
      data[i4 + 2] = position[i3 + 2]
      data[i4 + 4] = 0
    }

    this.#gpgpuPointVar = this.#gpgpu.addVariable(
      'texturePoint',
      gpGpufragmentShader,
      texture,
    )
    this.#gpgpu.setVariableDependencies(this.#gpgpuPointVar, [
      this.#gpgpuPointVar,
    ])

    this.#gpgpu.init()
  }

  /**
   * Init controls
   *
   * @returns {void}
   */
  #initControls(): void {
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.enableDamping = true
  }

  /**
   * Init renderer
   *
   * @returns {void}
   */
  #initRenderer(): void {
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)

    let antialias = false
    const dpr = this.#getPixelRatio()
    if (dpr < 2) {
      antialias = true
    }
    this.#renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: antialias,
    })
    this.#resizeRenderer()

    window.addEventListener('resize', this.#resizeRenderer.bind(this))
  }

  /**
   * Init camera
   *
   * @returns {void}
   */
  #initCamera(): void {
    this.#camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )

    this.#camera.position.z = 10
    this.#scene.add(this.#camera)
  }

  /**
   * Init scene
   *
   * @returns {void}
   */
  #initScene(): void {
    this.#scene = new THREE.Scene()
  }

  /**
   * Init model
   *
   * @returns {void}
   */
  #initModel(): void {
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/thr2pxl/js/draco/')
    loader.setDRACOLoader(dracoLoader)

    loader.load('/thr2pxl/media/models/ship.glb', (model: GLTF) => {
      this.#model = model.scene.children[0] as THREE.Mesh
      this.#initGpGpu()
      this.#initPoints()
    })
  }

  /**
   * Get pixel ratio
   *
   * @returns {number}
   */
  #getPixelRatio(): number {
    return Math.min(window.devicePixelRatio, 2)
  }
}
new Main()
