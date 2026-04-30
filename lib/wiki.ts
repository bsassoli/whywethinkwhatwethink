import rawPages from './wiki-data.json'

export type PageType = 'chapter' | 'concept' | 'person' | 'study'

export interface WikiPage {
  slug: string
  type: PageType
  title: string
  tags: string[]
  chapters: number[]
  content: string
}

export interface GraphNode {
  id: string
  name: string
  type: PageType
  val: number
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

function extractWikilinks(content: string): string[] {
  const links: string[] = []
  const regex = /\[\[([^\]]+)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) links.push(match[1])
  return [...new Set(links)]
}

export function getAllPages(): WikiPage[] {
  return rawPages as WikiPage[]
}

export function getPage(slug: string): WikiPage | undefined {
  return getAllPages().find(p => p.slug === slug)
}

export function buildGraphData(): GraphData {
  const pages = getAllPages()
  const slugIndex = new Map(pages.map(p => [p.slug, p]))
  const titleIndex = new Map(pages.map(p => [p.title, p]))

  function resolve(link: string): WikiPage | undefined {
    return slugIndex.get(link) ?? titleIndex.get(link)
  }

  const edgeSet = new Set<string>()
  const connectionCount = new Map<string, number>(pages.map(p => [p.slug, 0]))
  const links: GraphLink[] = []

  for (const page of pages) {
    for (const link of extractWikilinks(page.content)) {
      const target = resolve(link)
      if (!target || target.slug === page.slug) continue
      const key = [page.slug, target.slug].sort().join('||')
      if (edgeSet.has(key)) continue
      edgeSet.add(key)
      links.push({ source: page.slug, target: target.slug })
      connectionCount.set(page.slug, (connectionCount.get(page.slug) ?? 0) + 1)
      connectionCount.set(target.slug, (connectionCount.get(target.slug) ?? 0) + 1)
    }
  }

  const nodes: GraphNode[] = pages.map(p => ({
    id: p.slug,
    name: p.title,
    type: p.type,
    val: Math.max(1, connectionCount.get(p.slug) ?? 1),
  }))

  return { nodes, links }
}

export function getAllWikiContext(): string {
  return getAllPages()
    .map(p => `### [${p.type.toUpperCase()}] ${p.title}\n${p.content}`)
    .join('\n\n---\n\n')
}
