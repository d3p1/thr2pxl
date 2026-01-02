/**
 * @description Renderer manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              render logic
 */
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'

/**
 * @constant
 * @type {number}
 */
const MAX_DPR: number = 2

/**
 * @constant
 * @type {number}
 */
const DEFAULT_CAMERA_FOV: number = 75

/**
 * @constant
 * @type {number}
 */
const DEFAULT_CAMERA_NEAR: number = 0.1

/**
 * @constant
 * @type {number}
 */
const DEFAULT_CAMERA_FAR: number = 1000

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
   */
  readonly #width: number

  /**
   * @type {number}
   */
  readonly #height: number

  /**
   * @type {number}
   */
  #dpr: number

  /**
   * @type {OrbitControls | null}
   */
  #cameraControls: OrbitControls | null = null

  /**
   * @type {THREE.Vector3}
   */
  readonly #cameraPosition: THREE.Vector3

  /**
   * @type {number}
   */
  readonly #cameraFov: number

  /**
   * @type {number}
   */
  readonly #cameraNear: number

  /**
   * @type {number}
   */
  readonly #cameraFar: number

  /**
   * Constructor
   *
   * @param {number}        width
   * @param {number}        height
   * @param {THREE.Vector3} cameraPosition
   * @param {number}        cameraFov
   * @param {number}        cameraNear
   * @param {number}        cameraFar
   * @param {boolean}       isCameraControlsEnabled
   */
  constructor(
    width: number,
    height: number,
    cameraPosition: THREE.Vector3 = new THREE.Vector3(
      0,
      0,
      DEFAULT_CAMERA_FAR * 0.5,
    ),
    cameraFov: number = DEFAULT_CAMERA_FOV,
    cameraNear: number = DEFAULT_CAMERA_NEAR,
    cameraFar: number = DEFAULT_CAMERA_FAR,
    isCameraControlsEnabled: boolean = true,
  ) {
    this.#width = width
    this.#height = height
    this.#cameraPosition = cameraPosition
    this.#cameraFov = cameraFov
    this.#cameraNear = cameraNear
    this.#cameraFar = cameraFar

    this.#initScene()
    this.#initCamera()
    this.#initRenderer()

    if (isCameraControlsEnabled) {
      this.#initCameraControls()
    }
  }

  /**
   * Update
   *
   * @param   {number} deltaTime
   * @returns {void}
   */
  update(deltaTime: number): void {
    if (this.#cameraControls) {
      this.#cameraControls.update(deltaTime)
    }

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
   * Init camera controls
   *
   * @returns {void}
   */
  #initCameraControls(): void {
    this.#cameraControls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    )
    this.#cameraControls.enableDamping = true
  }

  /**
   * Init renderer
   *
   * @returns {void}
   */
  #initRenderer(): void {
    this.#dpr = Math.min(window.devicePixelRatio, MAX_DPR)

    let antialias = false
    if (this.#dpr <= 1) {
      antialias = true
    }

    const canvas = document.createElement('canvas')
    this.renderer = new THREE.WebGLRenderer({
      antialias: antialias,
      canvas: canvas,
    })
    this.renderer.setClearAlpha(0)
    this.renderer.setSize(this.#width, this.#height)
    this.renderer.setPixelRatio(this.#dpr)
  }

  /**
   * Init camera
   *
   * @returns {void}
   */
  #initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      this.#cameraFov,
      this.#width / this.#height,
      this.#cameraNear,
      this.#cameraFar,
    )
    this.camera.position.copy(this.#cameraPosition)
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
}
