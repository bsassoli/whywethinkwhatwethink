import Nav from '@/components/Nav'
import GraphExplorer from '@/components/GraphExplorer'
import { buildGraphData } from '@/lib/wiki'

export const metadata = {
  title: 'Explore the Knowledge Graph — Why We Think What We Think',
  description: 'An interactive 3D map of the concepts, people, and studies in the book.',
}

export default function ExplorePage() {
  const data = buildGraphData()

  return (
    <>
      <Nav />
      <GraphExplorer data={data} />
    </>
  )
}
