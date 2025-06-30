/**
 * @description Types
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */

/**
 * @note Camera configuration for the model that should be rendered
 */
export interface ModelSourceCamera {
  position?: {
    x: number
    y: number
    z: number
  }
  fov?: number
  near?: number
  far?: number
  isControlsEnabled?: boolean
}

/**
 * @note Model that should be rendered
 */
export interface ModelSource {
  src: {
    highPoly: string
    lowPoly: string
  }
  width: number
  height: number
  camera?: ModelSourceCamera
  point?: {
    size?: number
    motion?: {
      frequency?: number
      strength?: number
      ratio?: number
      lifeDecay?: number
    }
  }
}

/**
 * @note Model by breakpoint
 */
export interface ModelSourceCollection {
  [breakpoint: number]: ModelSource
}

/**
 * @note Configuration that sets up library behavior
 */
export interface Config {
  containerSelector?: string
  models: ModelSourceCollection
  loader?: {
    dracoUrl?: string
  }
  pointer?: {
    strength?: number
    minRad?: number
    maxRad?: number
    pulseStrength?: number
    pulseFrequency?: number
  }
  isDebugging?: boolean
}
