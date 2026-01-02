/**
 * @description Hook
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import {useEffect, useRef} from 'react'
import {type Config, Thr2Pxl} from '../../core'

export default function useThr2Pxl(config: Config) {
  const instanceRef = useRef<Thr2Pxl>(null)

  useEffect(() => {
    instanceRef.current?.dispose()
    instanceRef.current = new Thr2Pxl(config)

    return () => instanceRef.current?.dispose()
  }, [config])

  return instanceRef
}
