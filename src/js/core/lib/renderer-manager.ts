/**
 * @description Renderer manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              render logic
 */
import * as THREE from 'three'

/**
 * @const {number}
 */
const MAX_DPR = 2

/**
 * @const {number}
 */
const CAMERA_NEAR = 0.1

/**
 * @const {number}
 */
const CAMERA_FAR = 1000

export default class RendererManager {
  /**
   * @type {THREE.WebGLRenderer}
   */
  renderer: THREE.WebGLRenderer

  /**
   * @type {THREE.PerspectiveCamera}
   */
  camera: THREE.PerspectiveCamera

  /**
   * @type {THREE.Scene}
   */
  scene: THREE.Scene

  /**
   * @type {number}
   * @note This property will store the aspect ratio between
   *       container width and window width.
   *       In that way, every time the window is resized,
   *       we can calculate container width based on the window's width
   */
  #windowAspect: number

  /**
   * @type {number}
   * @note This property will store the aspect ratio between
   *       container height and container width.
   *       In that way, every time the container is resized,
   *       we can calculate its height based on its width
   */
  #containerAspect: number

  /**
   * @type {number}
   */
  #width: number

  /**
   * @type {number}
   */
  #height: number

  /**
   * @type {number}
   */
  #dpr: number

  /**
   * @type {number}
   */
  readonly #fov: number

  /**
   * @type {() => void}
   */
  #boundHandleResize: () => void

  /**
   * Constructor
   *
   * @param {number} fov
   * @param {number} width
   * @param {number} height
   */
  constructor(fov: number, width: number, height: number) {
    this.#fov = fov

    this.#initSizes(width, height)
    this.#initScene()
    this.#initCamera()
    this.#initRenderer()
  }

  /**
   * Update
   *
   * @returns {void}
   */
  update(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Compile shaders
   *
   * @returns {void}
   * {@link   https://github.com/mrdoob/three.js/pull/10960}
   */
  compile(): void {
    this.renderer.compile(this.scene, this.camera)
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    window.removeEventListener('resize', this.#boundHandleResize)

    this.#disposeScene()
    this.#disposeRenderer()
  }

  /**
   * Dispose scene
   *
   * @returns {void}
   */
  #disposeScene(): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0])
    }
  }

  /**
   * Dispose renderer
   *
   * @returns {void}
   */
  #disposeRenderer(): void {
    this.renderer.domElement.remove()
    this.renderer.dispose()
  }

  /**
   * Resize renderer
   *
   * @returns {void}
   */
  #resizeRenderer(): void {
    this.#initDpr()

    this.#width = this.#windowAspect * window.innerWidth
    this.#height = this.#containerAspect * this.#width

    this.renderer.setSize(this.#width, this.#height)
    this.renderer.setPixelRatio(this.#dpr)

    this.camera.aspect = this.#width / this.#height
    this.camera.updateProjectionMatrix()
  }

  /**
   * Init renderer
   *
   * @returns {void}
   */
  #initRenderer(): void {
    const canvas = document.createElement('canvas')

    let antialias = false
    if (this.#dpr <= 1) {
      antialias = true
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: antialias,
      canvas: canvas,
    })
    this.renderer.setClearAlpha(0)

    this.#boundHandleResize = this.#resizeRenderer.bind(this)
    window.addEventListener('resize', this.#boundHandleResize)

    this.#resizeRenderer()
  }

  /**
   * Init camera
   *
   * @returns {void}
   */
  #initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      this.#fov,
      this.#width / this.#height,
      CAMERA_NEAR,
      CAMERA_FAR,
    )
    this.camera.position.set(0, 0, this.camera.near - 0.1)
    this.scene.add(this.camera)
  }

  /**
   * Init scene
   *
   * @returns {void}
   */
  #initScene(): void {
    this.scene = new THREE.Scene()
  }

  /**
   * Init device pixel ratio
   *
   * @returns {void}
   */
  #initDpr(): void {
    this.#dpr = Math.min(window.devicePixelRatio, MAX_DPR)
  }

  /**
   * Init sizes
   *
   * @param   {number} width
   * @param   {number} height
   * @returns {void}
   */
  #initSizes(width: number, height: number): void {
    this.#width = width
    this.#height = height
    this.#windowAspect = this.#width / window.innerWidth
    this.#containerAspect = this.#height / this.#width
  }
}
