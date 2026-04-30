'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GraphData, GraphNode, GraphLink, PageType } from '@/lib/wiki'
import styles from './GraphExplorer.module.css'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Building the knowledge graph…</div>
})

const NODE_COLORS: Record<PageType, string> = {
  chapter: '#C8312A',
  concept: '#D4A853',
  person:  '#F4EDD8',
  study:   '#8FAE9B',
}

const TYPE_LABELS: Record<PageType, string> = {
  chapter: 'Chapter',
  concept: 'Concept',
  person:  'Person',
  study:   'Study',
}

const ACTIVE_TYPES: Record<PageType, boolean> = {
  chapter: true, concept: true, person: true, study: true,
}

interface Connection {
  id: string
  name: string
  type: PageType
}

interface SelectedNode extends GraphNode {
  connections: Connection[]
}

export default function GraphExplorer({ data }: { data: GraphData }) {
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [activeTypes, setActiveTypes] = useState({ ...ACTIVE_TYPES })
  const [dims, setDims] = useState({ w: 1200, h: 800 })
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const filteredData = {
    nodes: data.nodes.filter(n => activeTypes[n.type]),
    links: data.links.filter(l => {
      const sid = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
      const tid = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
      const s = data.nodes.find(n => n.id === sid)
      const t = data.nodes.find(n => n.id === tid)
      return s && t && activeTypes[s.type] && activeTypes[t.type]
    })
  }

  const flyToNode = useCallback((nodeId: string) => {
    if (!graphRef.current) return
    const node = filteredData.nodes.find(n => n.id === nodeId) as any
    if (!node) return
    const { x = 0, y = 0, z = 0 } = node
    const mag = Math.sqrt(x * x + y * y + z * z) || 1
    const dist = 180
    graphRef.current.cameraPosition(
      { x: x + (x / mag) * dist, y: y + (y / mag) * dist, z: z + (z / mag) * dist },
      { x, y, z },
      1200
    )
  }, [filteredData.nodes])

  const selectNode = useCallback((node: GraphNode) => {
    const connections = data.links
      .filter(l => {
        const sid = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
        const tid = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
        return sid === node.id || tid === node.id
      })
      .map(l => {
        const sid = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
        const tid = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
        const peerId = sid === node.id ? tid : sid
        const peer = data.nodes.find(n => n.id === peerId)
        return peer ? { id: peer.id, name: peer.name, type: peer.type } : null
      })
      .filter((c): c is Connection => c !== null)
      .sort((a, b) => a.name.localeCompare(b.name))

    setSelected({ ...node, connections })
  }, [data])

  const handleNodeClick = useCallback((node: any) => {
    selectNode(node as GraphNode)
    flyToNode(node.id)
  }, [selectNode, flyToNode])

  const handleConnectionClick = (conn: Connection) => {
    const node = data.nodes.find(n => n.id === conn.id)
    if (!node) return
    selectNode(node)
    flyToNode(conn.id)
  }

  const toggleType = (t: PageType) => {
    setActiveTypes(prev => ({ ...prev, [t]: !prev[t] }))
  }

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.controlsTitle}>Filter by type</div>
        {(Object.keys(ACTIVE_TYPES) as PageType[]).map(t => (
          <button
            key={t}
            className={`${styles.filterBtn} ${!activeTypes[t] ? styles.inactive : ''}`}
            onClick={() => toggleType(t)}
          >
            <span className={styles.dot} style={{ background: NODE_COLORS[t] }} />
            {TYPE_LABELS[t]}
          </button>
        ))}
        <div className={styles.nodeCount}>
          {filteredData.nodes.length} nodes · {filteredData.links.length} connections
        </div>
      </div>

      <div ref={containerRef} className={styles.canvas}>
        <ForceGraph3D
          ref={graphRef}
          graphData={filteredData as any}
          width={dims.w}
          height={dims.h}
          backgroundColor="#1A1714"
          nodeLabel="name"
          nodeColor={(n: any) => NODE_COLORS[n.type as PageType] ?? '#F4EDD8'}
          nodeVal={(n: any) => Math.max(1, n.val)}
          nodeRelSize={4}
          linkColor={() => 'rgba(244,237,216,0.12)'}
          linkWidth={0.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleColor={() => 'rgba(200,49,42,0.6)'}
          onNodeClick={handleNodeClick}
          enableNodeDrag={false}
        />
      </div>

      {selected && (
        <div className={styles.panel}>
          <button className={styles.close} onClick={() => setSelected(null)} aria-label="Close">×</button>
          <div className={styles.panelType}>
            <span className={styles.typeDot} style={{ background: NODE_COLORS[selected.type] }} />
            {TYPE_LABELS[selected.type]}
          </div>
          <h2 className={styles.panelTitle}>{selected.name}</h2>
          {selected.excerpt && (
            <p className={styles.panelExcerpt}>{selected.excerpt}</p>
          )}
          <div className={styles.panelConnections}>
            <div className={styles.panelConnLabel}>
              {selected.connections.length} connections — click to explore
            </div>
            <div className={styles.connList}>
              {selected.connections.map((c) => (
                <button
                  key={c.id}
                  className={styles.connTag}
                  onClick={() => handleConnectionClick(c)}
                  style={{ borderLeftColor: NODE_COLORS[c.type] }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.hint}>
        Click any node to explore · Red particles show connections
      </div>
    </div>
  )
}
