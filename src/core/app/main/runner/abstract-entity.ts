/**
 * @description Abstract entity
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        Main entities of this implementation will need to load
 *              a model to work. The idea behind this class is to
 *              encapsulate the common behavior of these entities
 */
import * as THREE from 'three'
import ModelLoaderManager from '../../../services/model-loader-manager.js'

export default abstract class AbstractEntity {
  /**
   * @type {THREE.Mesh<THREE.BufferGeometry, THREE.Material> | null}
   */
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> | null = null

  /**
   * @type {string}
   */
  readonly #modelUrl: string

  /**
   * @type {ModelLoaderManager}
   */
  #modelLoaderManager: ModelLoaderManager

  /**
   * Constructor
   *
   * @param {string}             modelUrl
   * @param {ModelLoaderManager} modelLoaderManager
   */
  protected constructor(
    modelUrl: string,
    modelLoaderManager: ModelLoaderManager,
  ) {
    this.#modelUrl = modelUrl
    this.#modelLoaderManager = modelLoaderManager
  }

  /**
   * Load entity/model
   *
   * @returns {Promise<void>}
   */
  async load(): Promise<void> {
    this.mesh = await this.#modelLoaderManager.loadMeshFromModel(this.#modelUrl)
    this.mesh.geometry.center()
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.mesh?.geometry.dispose()
    this.mesh?.material.dispose()
  }
}
