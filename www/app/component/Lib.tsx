/**
 * @description Library component
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
'use client'

import {useEffect} from 'react'
import Thr2pxl from '@d3p1/thr2pxl'

export default function Lib() {
  useEffect(() => {
    new Thr2pxl({
      models: {
        0: {
          src: {
            highPoly: '/thr2pxl/media/images/lib/queen/queen.glb',
            lowPoly: '/thr2pxl/media/images/lib/queen/queen.simplified.glb',
          },
          width: window.innerWidth * 0.55,
          height: window.innerHeight * 0.75,
          camera: {
            position: {
              x: 0,
              y: 0,
              z: 6,
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
            highPoly: '/thr2pxl/media/images/lib/queen/queen.glb',
            lowPoly: '/thr2pxl/media/images/lib/queen/queen.simplified.glb',
          },
          width: window.innerWidth * 0.25,
          height: window.innerHeight * 0.85,
          camera: {
            position: {
              x: 0,
              y: 0,
              z: 4,
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
        dracoUrl: '/thr2pxl/js/draco/',
      },
      containerSelector: '#thr2pxl',
      isDebugging: true,
    })
  }, [])

  return (
    <div
      id="thr2pxl"
      className="w-full h-full flex flex-col justify-center items-center"
    ></div>
  )
}
