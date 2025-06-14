/**
 * @description Model loader manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              model loader logic
 */
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js'

export default class ModelLoaderManager {
  /**
   * @type {GLTFLoader}
   */
  #loader: GLTFLoader

  /**
   * @type {DRACOLoader}
   */
  #dracoLoader: DRACOLoader

  /**
   * @type {string | null}
   */
  readonly #dracoPath: string | null = null

  /**
   * Constructor
   *
   * @param {string | null} dracoPath
   */
  constructor(dracoPath: string | null = null) {
    if (dracoPath) {
      this.#dracoPath = dracoPath
    }

    this.#initLoader()
  }

  /**
   * Load mesh from the model
   *
   * @param   {string} url
   * @returns {Promise<THREE.Mesh<THREE.BufferGeometry, THREE.Material>>}
   * @note    For now, this implementation only
   *          supports `.gltf` and `.glb` models,
   *          and they must have the desired mesh as a
   *          root mesh of the scene
   *          (`model.scene.children[0]`)
   */
  async loadMeshFromModel(
    url: string,
  ): Promise<THREE.Mesh<THREE.BufferGeometry, THREE.Material>> {
    const model = await this.#loader.loadAsync(url)
    return model.scene.children[0] as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.Material
    >
  }

  /**
   * Dispose
   *
   * @returns {void}
   */
  dispose(): void {
    this.#dracoLoader.dispose()
  }

  /**
   * Init loader
   *
   * @returns {void}
   */
  #initLoader(): void {
    this.#loader = new GLTFLoader()

    if (this.#dracoPath) {
      this.#dracoLoader = new DRACOLoader()
      this.#dracoLoader.setDecoderPath(this.#dracoPath)
      this.#loader.setDRACOLoader(this.#dracoLoader)
    }
  }
}
