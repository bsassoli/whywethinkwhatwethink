/**
 * Reads wiki markdown files from ../wiki/ and writes lib/wiki-data.json.
 * Run before build: `node scripts/prebuild-wiki.mjs`
 * Also wired as `npm run prebuild` for convenience.
 */
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const WIKI_DIR = path.join(__dir, '..', '..', 'wiki')
const OUT = path.join(__dir, '..', 'lib', 'wiki-data.json')
const SUBDIRS = ['chapters', 'concepts', 'people', 'studies']

const typeMap = { chapters: 'chapter', concepts: 'concept', people: 'person', studies: 'study' }

const pages = []
for (const sub of SUBDIRS) {
  const dir = path.join(WIKI_DIR, sub)
  if (!fs.existsSync(dir)) { console.warn(`⚠ Not found: ${dir}`); continue }
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8')
    const { data, content } = matter(raw)
    const slug = file.replace(/\.md$/, '')
    pages.push({
      slug,
      type: data.type ?? typeMap[sub],
      title: slug.replace(/^\d{2} - /, ''),
      tags: data.tags ?? [],
      chapters: data.chapters ?? [],
      content,
    })
  }
}

fs.writeFileSync(OUT, JSON.stringify(pages, null, 2))
console.log(`✓ wiki-data.json — ${pages.length} pages`)
