/**
 * @description Config
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import queenModelUrl from '../../media/models/queen/queen.glb'
import lowPolyQueenModelUrl from '../../media/models/queen/queen.simplified.glb'

export const config = {
  models: {
    0: {
      src: {
        highPoly: queenModelUrl,
        lowPoly: lowPolyQueenModelUrl,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      camera: {
        position: {
          x: 0,
          y: 0,
          z: 8,
        },
      },
      point: {
        size: 5,
        motion: {
          frequency: 0.1,
          strength: 1.5,
          ratio: 0.25,
          lifeDecay: 0.2,
        },
      },
    },
    769: {
      src: {
        highPoly: queenModelUrl,
        lowPoly: lowPolyQueenModelUrl,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      camera: {
        position: {
          x: 0,
          y: 0,
          z: 5,
        },
      },
      point: {
        size: 5,
        motion: {
          frequency: 0.1,
          strength: 1.5,
          ratio: 0.25,
          lifeDecay: 0.2,
        },
      },
    },
  },
  pointer: {
    strength: 0.2,
    minRad: 1,
    maxRad: 2,
    pulseStrength: 0.2,
    pulseFrequency: 1,
  },
  loader: {
    dracoUrl: './js/draco/',
  },
  isDebugging: true,
}
