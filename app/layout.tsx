import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Why We Think What We Think — Turi Munthe',
  description: 'The unexpected origins of our deepest beliefs. An interactive companion to the book by Turi Munthe.',
  openGraph: {
    title: 'Why We Think What We Think',
    description: 'The unexpected origins of our deepest beliefs.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
