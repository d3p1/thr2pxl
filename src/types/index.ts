/**
 * @description Types
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */

/**
 * @note Model that should be rendered
 */
export interface ModelSource {
  src: {
    highPoly: string
    lowPoly: string
  }
  width?: number
  height?: number
  camera?: {
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
  point?: {
    size?: number
    motion?: {
      frequency?: number
      strength?: number
      strengthRatio?: number
      lifeDecay?: number
    }
  }
}

/**
 * @note Configuration that sets up library behavior
 */
export interface Config {
  containerSelector?: string
  model: ModelSource
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
