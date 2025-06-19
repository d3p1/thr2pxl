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
      model: {
        src: {
          highPoly: '/thr2pxl/media/images/lib/ship.glb',
          lowPoly: '/thr2pxl/media/images/lib/ship.simplified.glb',
        },
        width: 1200,
        height: 800,
        camera: {
          position: {
            x: 5,
            y: 0,
            z: 10,
          },
        },
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
