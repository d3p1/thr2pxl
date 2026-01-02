/**
 * @description Lib
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import {useThr2Pxl} from '@d3p1/thr2pxl/react'
import {config} from '../../etc/config.js'

export default function Lib() {
  useThr2Pxl(config)
  return null
}
