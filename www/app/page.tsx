/**
 * @description Home page
 * @author      C. M. de Picciotto <d3p1@d3p1.dev> (https://d3p1.dev/)
 */
import dynamic from 'next/dynamic'

const Lib = dynamic(() => import('@/app/component/Lib'), {ssr: false})

export default function HomePage() {
  return <Lib />
}
