/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'

class Main {
  /**
   * @type {THREE.Mesh}
   */
  #mesh: THREE.Mesh

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
    this.#initScene()
    this.#initCamera()
    this.#initMesh()
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
    this.#controls.update()

    this.#renderer.render(this.#scene, this.#camera)

    requestAnimationFrame(this.#animate.bind(this))
  }

  #resizeRenderer(): void {
    this.#camera.aspect = window.innerWidth / window.innerHeight
    this.#camera.updateProjectionMatrix()

    this.#renderer.setSize(window.innerWidth, window.innerHeight)
    this.#renderer.setPixelRatio(this.#getPixelRatio())
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
    this.#renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: antialias})
    this.#resizeRenderer()

    window.addEventListener('resize', this.#resizeRenderer.bind(this))
  }

  /**
   * Init mesh
   *
   * @returns {void}
   */
  #initMesh(): void {
    this.#mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    )
    this.#scene.add(this.#mesh)
  }

  /**
   * Init camera
   *
   * @returns {void}
   */
  #initCamera(): void {
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.#camera.position.z = 2
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
   * Get pixel ratio
   *
   * @returns {number}
   */
  #getPixelRatio(): number {
    return Math.min(window.devicePixelRatio, 2)
  }
}
new Main()