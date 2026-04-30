'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import type { GraphData, GraphNode, PageType } from '@/lib/wiki'
import styles from './GraphExplorer.module.css'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Building the knowledge graph…</div>
})

const TYPE_LABELS: Record<PageType, string> = {
  chapter: 'Chapter', concept: 'Concept', person: 'Person', study: 'Study',
}

const ACTIVE_TYPES: Record<PageType, boolean> = {
  chapter: true, concept: true, person: true, study: true,
}

interface ThemeDef {
  id: string
  label: string
  background: string
  linkColor: string
  linkWidth: number
  particleColor: string
  nodeColors: Record<PageType, string>
  labelColor: string
}

const THEMES: ThemeDef[] = [
  {
    id: 'ink', label: 'Ink',
    background: '#1A1714',
    linkColor: 'rgba(244,237,216,0.30)',
    linkWidth: 1,
    particleColor: '#C8312A',
    nodeColors: { chapter: '#C8312A', concept: '#D4A853', person: '#F4EDD8', study: '#8FAE9B' },
    labelColor: 'rgba(244,237,216,0.90)',
  },
  {
    id: 'neural', label: 'Neural',
    background: '#080B14',
    linkColor: 'rgba(80,140,255,0.25)',
    linkWidth: 1.2,
    particleColor: '#40E0FF',
    nodeColors: { chapter: '#FF4466', concept: '#FFD94D', person: '#80C8FF', study: '#44FFAA' },
    labelColor: 'rgba(180,220,255,0.90)',
  },
  {
    id: 'cosmos', label: 'Cosmos',
    background: '#050508',
    linkColor: 'rgba(180,160,255,0.18)',
    linkWidth: 0.8,
    particleColor: '#C8A8FF',
    nodeColors: { chapter: '#FF8080', concept: '#FFDD80', person: '#FFFFFF', study: '#80FFCC' },
    labelColor: 'rgba(255,255,255,0.85)',
  },
]

function makeTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.font = '500 22px system-ui, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.length > 24 ? text.slice(0, 22) + '…' : text, 256, 32)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(40, 5, 1)
  sprite.position.set(0, 10, 0)
  return sprite
}

interface Connection { id: string; name: string; type: PageType }
interface SelectedNode extends GraphNode { connections: Connection[] }

export default function GraphExplorer({ data }: { data: GraphData }) {
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [activeTypes, setActiveTypes] = useState({ ...ACTIVE_TYPES })
  const [dims, setDims] = useState({ w: 1200, h: 800 })
  const [themeIdx, setThemeIdx] = useState(0)
  const [showLabels, setShowLabels] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const theme = THEMES[themeIdx]

  useEffect(() => {
    const measure = () => {
      if (containerRef.current)
        setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
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
    }),
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

  const nodeThreeObject = useCallback((node: any) => {
    return makeTextSprite(node.name, theme.labelColor)
  }, [theme.labelColor])

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.controlsTitle}>Filter by type</div>
        {(Object.keys(ACTIVE_TYPES) as PageType[]).map(t => (
          <button
            key={t}
            className={`${styles.filterBtn} ${!activeTypes[t] ? styles.inactive : ''}`}
            onClick={() => setActiveTypes(prev => ({ ...prev, [t]: !prev[t] }))}
          >
            <span className={styles.dot} style={{ background: theme.nodeColors[t] }} />
            {TYPE_LABELS[t]}
          </button>
        ))}

        <div className={styles.divider} />

        <div className={styles.controlsTitle}>Theme</div>
        <div className={styles.themeRow}>
          <button className={styles.themeArrow} onClick={() => setThemeIdx(i => (i + THEMES.length - 1) % THEMES.length)}>‹</button>
          <span className={styles.themeName}>{theme.label}</span>
          <button className={styles.themeArrow} onClick={() => setThemeIdx(i => (i + 1) % THEMES.length)}>›</button>
        </div>

        <button
          className={`${styles.labelToggle} ${showLabels ? styles.labelToggleOn : ''}`}
          onClick={() => setShowLabels(v => !v)}
        >
          {showLabels ? '— hide labels' : '+ show labels'}
        </button>

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
          backgroundColor={theme.background}
          nodeLabel="name"
          nodeColor={(n: any) => theme.nodeColors[n.type as PageType] ?? '#F4EDD8'}
          nodeVal={(n: any) => Math.max(1, n.val)}
          nodeRelSize={4}
          nodeThreeObjectExtend={showLabels}
          nodeThreeObject={showLabels ? nodeThreeObject : undefined}
          linkColor={() => theme.linkColor}
          linkWidth={theme.linkWidth}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleColor={() => theme.particleColor}
          onNodeClick={handleNodeClick}
          enableNodeDrag={false}
        />
      </div>

      {selected && (
        <div className={styles.panel}>
          <button className={styles.close} onClick={() => setSelected(null)} aria-label="Close">×</button>
          <div className={styles.panelType}>
            <span className={styles.typeDot} style={{ background: theme.nodeColors[selected.type] }} />
            {TYPE_LABELS[selected.type]}
          </div>
          <h2 className={styles.panelTitle}>{selected.name}</h2>
          {selected.excerpt && <p className={styles.panelExcerpt}>{selected.excerpt}</p>}
          <div className={styles.panelConnections}>
            <div className={styles.panelConnLabel}>
              {selected.connections.length} connections — click to explore
            </div>
            <div className={styles.connList}>
              {selected.connections.map(c => (
                <button
                  key={c.id}
                  className={styles.connTag}
                  onClick={() => handleConnectionClick(c)}
                  style={{ borderLeftColor: theme.nodeColors[c.type] }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.hint}>
        Click any node to explore · Particles show connections
      </div>
    </div>
  )
}
