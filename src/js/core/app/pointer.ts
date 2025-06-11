/**
 * @description Pointer
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              pointer logic
 */
import * as THREE from 'three'
import RendererManager from '../lib/renderer-manager.js'

export default class Pointer {
  /**
   * @type {THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]}
   */
  intersections: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[] =
    []

  /**
   * @type {THREE.Mesh}
   */
  readonly #raycasterMesh: THREE.Mesh

  /**
   * @type {THREE.Raycaster}
   */
  #raycaster: THREE.Raycaster

  /**
   * @type {THREE.Vector2}
   * @note Normalize device coordinates.
   *       Coordinates required by the raycaster
   */
  #ndc: THREE.Vector2

  /**
   * @type {RendererManager}
   */
  #rendererManager: RendererManager

  /**
   * @type {(e: PointerEvent) => void}
   */
  #boundHandlePointerMove: (e: PointerEvent) => void

  /**
   * @type {() => void}
   */
  #boundHandlePointerLeave: () => void

  /**
   * Constructor
   *
   * @param {THREE.Mesh}      raycasterMesh
   * @param {RendererManager} rendererManager
   */
  constructor(raycasterMesh: THREE.Mesh, rendererManager: RendererManager) {
    this.#raycasterMesh = raycasterMesh
    this.#rendererManager = rendererManager

    this.#initRaycaster()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.#rendererManager.renderer.domElement.removeEventListener(
      'pointermove',
      this.#boundHandlePointerMove,
    )
    this.#rendererManager.renderer.domElement.removeEventListener(
      'pointerleave',
      this.#boundHandlePointerLeave,
    )
  }

  /**
   * Handle pointer move
   *
   * @param   {PointerEvent} e
   * @returns {void}
   */
  #handlePointerMove(e: PointerEvent): void {
    this.#processNdc(e.offsetX, e.offsetY)
    this.#raycaster.setFromCamera(this.#ndc, this.#rendererManager.camera)
    this.intersections = this.#raycaster.intersectObject(this.#raycasterMesh)
  }

  /**
   * Handle pointer leave
   *
   * @returns {void}
   */
  #handlePointerLeave(): void {
    this.intersections = []
  }

  /**
   * Init raycaster
   *
   * @returns {void}
   */
  #initRaycaster(): void {
    this.#ndc = new THREE.Vector2()
    this.#raycaster = new THREE.Raycaster()

    this.#boundHandlePointerMove = this.#handlePointerMove.bind(this)
    this.#boundHandlePointerLeave = this.#handlePointerLeave.bind(this)

    this.#rendererManager.renderer.domElement.addEventListener(
      'pointermove',
      this.#boundHandlePointerMove,
    )
    this.#rendererManager.renderer.domElement.addEventListener(
      'pointerleave',
      this.#boundHandlePointerLeave,
    )
  }

  /**
   * Process normalized device coordinates
   *
   * @param   {number} x
   * @param   {number} y
   * @returns {void}
   */
  #processNdc(x: number, y: number): void {
    this.#ndc.set(
      (x / this.#rendererManager.renderer.domElement.width - 0.5) * 2,
      -((y / this.#rendererManager.renderer.domElement.height - 0.5) * 2),
    )
  }
}
