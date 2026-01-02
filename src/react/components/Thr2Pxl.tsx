/**
 * @description Component
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
'use client'

import useThr2Pxl from '../hooks/useThr2Pxl.js'
import type {Thr2PxlProps} from '../types'

export default function Thr2Pxl(props: Thr2PxlProps) {
  useThr2Pxl({...props, containerSelector: '#thr2pxl'})

  return <div id="thr2pxl"></div>
}
