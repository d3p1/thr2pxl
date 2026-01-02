/**
 * @description Model manager
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        The idea behind this class is to encapsulate and wrap the
 *              model management logic.
 *              It is defined a model by breakpoint, so it is necessary
 *              to handle which model should be used
 */
import type {ModelSource, ModelSourceCollection} from '../../types'

/**
 * @note The `0` breakpoint must always be set.
 *       It defines the model that should be used by default
 */
const DEFAULT_MODEL_BREAKPOINT = 0

export default class ModelManager {
  /**
   * @type {{
   *   src: {
   *     highPoly: string;
   *     lowPoly : string;
   *   };
   *   width  : number;
   *   height : number;
   *   camera?: {
   *     position?: {
   *       x: number;
   *       y: number;
   *       z: number;
   *     };
   *     fov              ?: number;
   *     near             ?: number;
   *     far              ?: number;
   *     isControlsEnabled?: boolean;
   *   };
   *   point?: {
   *     size  ?: number;
   *     motion?: {
   *       frequency?: number;
   *       strength ?: number;
   *       ratio    ?: number;
   *       lifeDecay?: number;
   *     }
   *   }
   * }[]}
   */
  models: ModelSourceCollection

  /**
   * @type {{
   *   src: {
   *     highPoly: string;
   *     lowPoly : string;
   *   };
   *   width  : number;
   *   height : number;
   *   camera?: {
   *     position?: {
   *       x: number;
   *       y: number;
   *       z: number;
   *     };
   *     fov              ?: number;
   *     near             ?: number;
   *     far              ?: number;
   *     isControlsEnabled?: boolean;
   *   };
   *   point?: {
   *     size  ?: number;
   *     motion?: {
   *       frequency?: number;
   *       strength ?: number;
   *       ratio    ?: number;
   *       lifeDecay?: number;
   *     }
   *   }
   * }}
   */
  currentModel: ModelSource

  /**
   * @type {number}
   */
  #currentBreakpoint: number

  /**
   * @type {number[]}
   */
  #breakpoints: number[]

  /**
   * Constructor
   *
   * @param {{
   *             src: {
   *               highPoly: string;
   *               lowPoly : string;
   *             };
   *             width  : number;
   *             height : number;
   *             camera?: {
   *               position?: {
   *                 x: number;
   *                 y: number;
   *                 z: number;
   *               };
   *               fov              ?: number;
   *               near             ?: number;
   *               far              ?: number;
   *               isControlsEnabled?: boolean;
   *             };
   *             point?: {
   *               size  ?: number;
   *               motion?: {
   *                 frequency?: number;
   *                 strength ?: number;
   *                 ratio    ?: number;
   *                 lifeDecay?: number;
   *               }
   *             }
   *         }[]} models
   * @throws {Error}
   */
  constructor(models: ModelSourceCollection) {
    this.models = models
    this.#initBreakpointsFromModels(Object.keys(this.models).map(Number))
    this.update()
  }

  /**
   * Taking into consideration window size,
   * it is selected the breakpoint and model to be used
   *
   * @returns {boolean}
   * @note    Each breakpoint defines the `min-width` at which
   *          a specific model should be used.
   *          That is why it is returned
   *          the greater breakpoint that is less than or equal
   *          the window size
   */
  update(): boolean {
    const width = window.innerWidth

    const currentBreakpoint = this.#breakpoints.reduce(
      (max, breakpoint) =>
        breakpoint <= width && breakpoint > max ? breakpoint : max,
      DEFAULT_MODEL_BREAKPOINT,
    )

    if (currentBreakpoint !== this.#currentBreakpoint) {
      this.#currentBreakpoint = currentBreakpoint
      this.currentModel = this.models[this.#currentBreakpoint]
      return true
    }

    return false
  }

  /**
   * Init breakpoints from models
   *
   * @param   {number[]} breakpoints
   * @returns {void}
   * @throws  {Error}
   */
  #initBreakpointsFromModels(breakpoints: number[]): void {
    if (
      breakpoints.find(
        (breakpoint) => breakpoint === DEFAULT_MODEL_BREAKPOINT,
      ) === undefined
    ) {
      throw new Error(
        'The `0` breakpoint is required. It defines the default model that should be used.',
      )
    }

    this.#breakpoints = breakpoints
  }
}
