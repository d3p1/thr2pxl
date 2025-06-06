/**
 * @description Main
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import {Pane} from 'tweakpane'
import * as THREE from 'three'
import {Timer} from 'three/examples/jsm/misc/Timer.js'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer.js'
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
   * @type {THREE.Raycaster}
   */
  #raycaster: THREE.Raycaster

  /**
   * @type {THREE.Vector2}
   */
  #raycasterCoord: THREE.Vector2

  /**
   * @type {THREE.Mesh}
   */
  #raycasterMesh: THREE.Mesh

  /**
   * @type {OrbitControls}
   */
  #controls: OrbitControls

  /**
   * @type {GLTFLoader}
   */
  #gltfLoader: GLTFLoader

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
   * @type {Pane}
   */
  #debugger: Pane

  /**
   * @type {Timer}
   */
  #timer: Timer

  /**
   * Constructor
   */
  constructor() {
    this.#initGltfLoader()
    this.#initModel()
    this.#initTimer()
    this.#initScene()
    this.#initCamera()
    this.#initRenderer()
    this.#initControls()

    this.#animate()
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

      this.#controls.update()

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

      this.#renderer.render(this.#scene, this.#camera)
    }

    requestAnimationFrame(this.#animate.bind(this))
  }

  /**
   * Raycast
   *
   * @returns {void}
   * @todo    Improve `uCursor` default value
   */
  #raycast(): void {
    if (this.#points && this.#raycasterMesh) {
      this.#raycaster.setFromCamera(this.#raycasterCoord, this.#camera)
      const intersections = this.#raycaster.intersectObject(this.#raycasterMesh)
      const material = this.#points.material as THREE.ShaderMaterial
      if (intersections.length) {
        material.uniforms.uCursor.value.set(...intersections[0].point)
      } else {
        material.uniforms.uCursor.value.set(-99999, -99999, -99999)
      }
    }
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
          this.#scene.add(this.#raycasterMesh)
        }
      },
    )

    /**
     * @todo Improve default value for `raycasterCoord`
     */
    this.#raycaster = new THREE.Raycaster()
    this.#raycasterCoord = new THREE.Vector2(-2, -2)

    this.#renderer.domElement.addEventListener('pointermove', (event) => {
      this.#raycasterCoord.x =
        (event.offsetX / this.#renderer.domElement.width - 0.5) * 2
      this.#raycasterCoord.y =
        -(event.offsetY / this.#renderer.domElement.height - 0.5) * 2

      this.#raycast()
    })

    /**
     * @todo Improve default value for `raycasterCoord`
     */
    this.#renderer.domElement.addEventListener('pointerout', () => {
      this.#raycasterCoord.set(-2, -2)

      this.#raycast()
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
    this.#camera.position.x = 5
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
