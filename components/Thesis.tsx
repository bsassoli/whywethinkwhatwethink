'use client'
import { useEffect, useRef } from 'react'
import styles from './Thesis.module.css'

export default function Thesis() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) e.target.classList.add('visible') },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section className={styles.section}>
      <div className={styles.ghostNum} aria-hidden>?</div>
      <div className={`${styles.content} fade-up`} ref={ref}>
        <div className={styles.label}>The Central Argument</div>
        <p className={styles.pull}>
          We did not <em className={styles.red}>choose</em> most of what we believe.<br />
          We <em className={styles.red}>inherited</em> it.
        </p>
        <p className={styles.body}>
          From the latitude at which our ancestors settled, to the language in which we first
          learned to think, to the particular twist of our DNA — an invisible web of forces
          assembled our worldview long before we were old enough to question it. Munthe&rsquo;s
          book doesn&rsquo;t argue that reason is useless. It argues that reason is rarer than
          we imagine, and that understanding this changes everything: how we talk to each other,
          how we govern ourselves, and how we hold our own opinions.
        </p>
      </div>
    </section>
  )
}
