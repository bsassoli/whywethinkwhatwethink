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
  particleCount: number
  particleSpeed: number
  nodeColors: Record<PageType, string>
  labelColor: string
  labelBg: string
  nodeStyle: 'sphere' | 'octahedron' | 'tetrahedron'
}

const THEMES: ThemeDef[] = [
  {
    id: 'ink', label: 'Ink',
    background: '#1A1714',
    linkColor: 'rgba(244,237,216,0.65)',
    linkWidth: 2,
    particleColor: '#C8312A',
    particleCount: 2,
    particleSpeed: 0.004,
    nodeColors: { chapter: '#C8312A', concept: '#D4A853', person: '#F4EDD8', study: '#8FAE9B' },
    labelColor: '#F4EDD8',
    labelBg: 'rgba(20,18,16,0.82)',
    nodeStyle: 'sphere',
  },
  {
    id: 'neural', label: 'Neural',
    background: '#080B14',
    linkColor: 'rgba(80,180,255,0.75)',
    linkWidth: 2,
    particleColor: '#40E0FF',
    particleCount: 3,
    particleSpeed: 0.006,
    nodeColors: { chapter: '#FF4466', concept: '#FFD94D', person: '#80C8FF', study: '#44FFAA' },
    labelColor: '#C0E8FF',
    labelBg: 'rgba(8,11,20,0.82)',
    nodeStyle: 'octahedron',
  },
  {
    id: 'alchemic', label: 'Alchemic',
    background: '#120E08',
    linkColor: 'rgba(210,160,55,0.62)',
    linkWidth: 1.8,
    particleColor: '#FFB830',
    particleCount: 2,
    particleSpeed: 0.003,
    nodeColors: { chapter: '#C8312A', concept: '#D4A030', person: '#C8C4A8', study: '#6B9B7A' },
    labelColor: '#F4E8C0',
    labelBg: 'rgba(18,14,8,0.85)',
    nodeStyle: 'tetrahedron',
  },
]

function buildThemeBg(themeId: string): THREE.Object3D | null {
  if (themeId === 'neural') {
    const group = new THREE.Group()
    group.name = 'theme-bg'

    // Dense dim background neuron field
    const count = 700
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 280 + Math.random() * 380
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    group.add(new THREE.Points(geo,
      new THREE.PointsMaterial({ color: '#1A4A80', size: 2, transparent: true, opacity: 0.45, sizeAttenuation: true })))

    // Brighter accent neurons scattered closer
    const count2 = 140
    const geo2 = new THREE.BufferGeometry()
    const pos2 = new Float32Array(count2 * 3)
    for (let i = 0; i < count2; i++) {
      const r = 200 + Math.random() * 460
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos2[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos2[i * 3 + 2] = r * Math.cos(phi)
    }
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3))
    group.add(new THREE.Points(geo2,
      new THREE.PointsMaterial({ color: '#40C0FF', size: 3, transparent: true, opacity: 0.60, sizeAttenuation: true })))

    return group
  }

  if (themeId === 'alchemic') {
    const group = new THREE.Group()
    group.name = 'theme-bg'

    const count = 350
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 220 + Math.random() * 440
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    group.add(new THREE.Points(geo,
      new THREE.PointsMaterial({ color: '#A06010', size: 1.5, transparent: true, opacity: 0.35, sizeAttenuation: true })))

    return group
  }

  return null
}

function makeTextSprite(text: string, color: string, bgColor: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 80
  const ctx = canvas.getContext('2d')!

  ctx.font = 'bold 28px system-ui, sans-serif'
  const label = text.length > 22 ? text.slice(0, 20) + '…' : text
  const tw = ctx.measureText(label).width
  const pad = 14
  const rx = (512 - tw) / 2 - pad
  const rw = tw + pad * 2
  const ry = 12
  const rh = 54
  const r = 8

  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.moveTo(rx + r, ry)
  ctx.lineTo(rx + rw - r, ry)
  ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r)
  ctx.lineTo(rx + rw, ry + rh - r)
  ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r)
  ctx.lineTo(rx + r, ry + rh)
  ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r)
  ctx.lineTo(rx, ry + r)
  ctx.arcTo(rx, ry, rx + r, ry, r)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 256, 40)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(54, 10, 1)
  sprite.position.set(0, 15, 0)
  return sprite
}

function makeNodeMesh(node: any, theme: ThemeDef): THREE.Object3D {
  const color = new THREE.Color(theme.nodeColors[node.type as PageType] ?? '#F4EDD8')
  const size = Math.min(10, Math.max(3, 3.5 * Math.cbrt(node.val || 1)))

  if (theme.nodeStyle === 'octahedron') {
    const geo = new THREE.OctahedronGeometry(size, 0)
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true })
    return new THREE.Mesh(geo, mat)
  }
  if (theme.nodeStyle === 'tetrahedron') {
    const geo = new THREE.TetrahedronGeometry(size * 1.1, 0)
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true })
    return new THREE.Mesh(geo, mat)
  }
  const geo = new THREE.SphereGeometry(size * 0.75, 14, 14)
  const mat = new THREE.MeshBasicMaterial({ color })
  return new THREE.Mesh(geo, mat)
}

interface Connection { id: string; name: string; type: PageType }
interface SelectedNode extends GraphNode { connections: Connection[] }

export default function GraphExplorer({ data }: { data: GraphData }) {
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [activeTypes, setActiveTypes] = useState({ ...ACTIVE_TYPES })
  const [dims, setDims] = useState({ w: 1200, h: 800 })
  const [themeIdx, setThemeIdx] = useState(0)
  const [showLabels, setShowLabels] = useState(false)
  const [showLinks, setShowLinks] = useState(true)
  const [graphReady, setGraphReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const bgObjRef = useRef<THREE.Object3D | null>(null)
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

  // Build / swap background scene objects when theme changes or graph becomes ready
  useEffect(() => {
    if (!graphReady || !graphRef.current) return
    const scene = graphRef.current.scene()

    // Remove previous
    const prev = scene.getObjectByName('theme-bg')
    if (prev) scene.remove(prev)
    bgObjRef.current = null

    const bg = buildThemeBg(theme.id)
    if (bg) {
      scene.add(bg)
      bgObjRef.current = bg
    }

    return () => {
      const obj = scene.getObjectByName('theme-bg')
      if (obj) scene.remove(obj)
    }
  }, [graphReady, theme.id])

  // Slowly rotate neural background
  useEffect(() => {
    if (theme.id !== 'neural') return
    let id: number
    const tick = () => {
      if (bgObjRef.current) {
        bgObjRef.current.rotation.y += 0.0003
        bgObjRef.current.rotation.x += 0.00012
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [theme.id])

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
    const group = new THREE.Group()
    group.add(makeNodeMesh(node, theme))
    if (showLabels) {
      group.add(makeTextSprite(node.name, theme.labelColor, theme.labelBg))
    }
    return group
  }, [theme, showLabels])

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

        <div className={styles.divider} />

        <button
          className={`${styles.labelToggle} ${showLabels ? styles.labelToggleOn : ''}`}
          onClick={() => setShowLabels(v => !v)}
        >
          {showLabels ? '— hide labels' : '+ show labels'}
        </button>

        <button
          className={`${styles.labelToggle} ${showLinks ? styles.labelToggleOn : ''}`}
          onClick={() => setShowLinks(v => !v)}
        >
          {showLinks ? '— hide connectors' : '+ show connectors'}
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
          nodeLabel={showLabels ? '' : 'name'}
          nodeColor={(n: any) => theme.nodeColors[n.type as PageType] ?? '#F4EDD8'}
          nodeVal={(n: any) => Math.max(1, n.val)}
          nodeRelSize={4}
          nodeThreeObjectExtend={false}
          nodeThreeObject={nodeThreeObject}
          linkVisibility={() => showLinks}
          linkColor={() => theme.linkColor}
          linkWidth={theme.linkWidth}
          linkDirectionalParticles={showLinks ? theme.particleCount : 0}
          linkDirectionalParticleSpeed={theme.particleSpeed}
          linkDirectionalParticleColor={() => theme.particleColor}
          onNodeClick={handleNodeClick}
          onEngineStop={() => setGraphReady(true)}
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
