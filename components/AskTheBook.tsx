'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './AskTheBook.module.css'

const SUGGESTED = [
  'Why do people in different countries have such different political views?',
  'What is the argumentative theory of reason?',
  'Can we escape the thinking patterns we\'re born into?',
  'How does loneliness shape our politics?',
]

interface Message {
  role: 'user' | 'book'
  text: string
}

export default function AskTheBook() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'book',
    text: "I'm the ideas behind Why We Think What We Think. Ask me anything — about the forces that shape belief, the science behind our convictions, or what recognising all this might mean for how we live together."
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const msgEnd = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) e.target.classList.add('visible') },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  const send = async (q?: string) => {
    const question = q ?? input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: question }]
        })
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let text = ''

      setMessages(prev => [...prev, { role: 'book', text: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'book', text }
          return next
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'book', text: 'Something went wrong. Please try again.' }])
    }

    setLoading(false)
  }

  return (
    <section className={styles.section} id="ask">
      <div className={`${styles.left} fade-up`} ref={ref}>
        <div className={styles.label}>Ask the Book</div>
        <h2 className={styles.title}>What would you like to understand?</h2>
        <p className={styles.body}>
          Query the ideas, arguments and provocations at the heart of Why We Think What We
          Think. Powered by the book&rsquo;s complete knowledge base.
        </p>
        <div className={styles.prompts}>
          {SUGGESTED.map((s, i) => (
            <button key={i} className={styles.promptBtn} onClick={() => send(s)}>
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </div>

      <div className={styles.interface}>
        <div className={styles.interfaceHeader}>
          <div className={styles.dot} />
          <span className={styles.dotLabel}>Ask the Book · Turi Munthe</span>
        </div>
        <div className={styles.messages}>
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className={styles.msgUser}>{m.text}</div>
            ) : (
              <div key={i} className={styles.msgBook}>
                <div className={styles.msgLabel}>Why We Think What We Think</div>
                <div className={styles.msgText}>{m.text}</div>
              </div>
            )
          )}
          {loading && messages[messages.length - 1]?.role !== 'book' && (
            <div className={styles.msgBook}>
              <div className={styles.msgLabel}>Why We Think What We Think</div>
              <div className={styles.typing}>
                <div className={styles.dot1} />
                <div className={styles.dot2} />
                <div className={styles.dot3} />
              </div>
            </div>
          )}
          <div ref={msgEnd} />
        </div>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            placeholder="Ask anything about the book's ideas…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className={styles.send} onClick={() => send()} aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14.5 8L2 2l3 6-3 6 12.5-6z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
