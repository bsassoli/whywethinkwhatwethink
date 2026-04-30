import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Thesis from '@/components/Thesis'
import Forces from '@/components/Forces'
import Chapters from '@/components/Chapters'
import AskTheBook from '@/components/AskTheBook'
import Preorder from '@/components/Preorder'
import Footer from '@/components/Footer'
import { getAllPages } from '@/lib/wiki'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

// Short tags per chapter for the card labels
const CHAPTER_TAGS: Record<number, string> = {
  1: 'Origins',
  2: 'Climate & Disease',
  3: 'Geography',
  4: 'Culture',
  5: 'Biology',
  6: 'Genetics',
  7: 'Emotion',
  8: 'Social Function',
  9: 'Evolution',
  10: 'Reason',
  11: 'Conclusion',
}

function firstParagraph(content: string): string {
  // Extract the core argument paragraph from chapter summaries
  const match = content.match(/## Core argument\s+([\s\S]+?)(?=\n##)/i)
  if (match) {
    return match[1].trim().split('\n')[0].replace(/\[\[([^\]]+)\]\]/g, '$1')
  }
  // Fallback: first non-empty paragraph
  const para = content.split('\n\n').find(p => p.trim() && !p.startsWith('#') && !p.startsWith('---'))
  return (para ?? '').replace(/\[\[([^\]]+)\]\]/g, '$1').trim().slice(0, 280)
}

export default function Home() {
  const pages = getAllPages()
  const chapterPages = pages
    .filter(p => p.type === 'chapter')
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const chapters = chapterPages.map((p, i) => ({
    num: ROMAN[i] ?? String(i + 1),
    tag: CHAPTER_TAGS[i + 1] ?? p.type,
    title: p.title,
    excerpt: firstParagraph(p.content),
  }))

  return (
    <>
      <Nav />
      <Hero />
      <Thesis />
      <Forces />
      <Chapters chapters={chapters} />
      <AskTheBook />
      <Preorder />
      <Footer />
    </>
  )
}
