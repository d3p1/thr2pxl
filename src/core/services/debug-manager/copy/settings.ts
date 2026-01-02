/**
 * @description Debug manager raw settings
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 * @note        It is returned a plain text of the settings that
 *              should be used to instance current effect.
 *              This plain text is used by the copy button of the
 *              debug manager
 */
export const getSettings = (
  modelPointSize: string,
  modelPointMotionFrequency: string,
  modelPointMotionStrength: string,
  modelPointMotionRatio: string,
  modelPointMotionLifeDecay: string,
  pointerStrength: string,
  pointerMinRad: string,
  pointerMaxRad: string,
  pointerPulseStrength: string,
  pointerPulseFrequency: string,
) => {
  return `{
    models: {
      0: {
        src: {
          highPoly: <model-high-poly-src>,
          lowPoly: <model-low-poly-src>
        },
        width: <model-width>,
        height: <model-height>,
        point: {
          size: ${modelPointSize},
          motion: {
            frequency: ${modelPointMotionFrequency},
            strength: ${modelPointMotionStrength},
            ratio: ${modelPointMotionRatio},
            lifeDecay: ${modelPointMotionLifeDecay}
          }
        }
      },
    }, 
    pointer: {
      strength: ${pointerStrength},
      minRad: ${pointerMinRad},
      maxRad: ${pointerMaxRad},
      pulseStrength: ${pointerPulseStrength},
      pulseFrequency: ${pointerPulseFrequency}
    }
  }`
}
