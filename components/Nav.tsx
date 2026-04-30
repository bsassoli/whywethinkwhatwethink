'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './Nav.module.css'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.brand}>
        Why We <span>Think</span>
      </Link>
      <ul className={styles.links}>
        <li><a href="/#forces">The Forces</a></li>
        <li><a href="/#chapters">The Book</a></li>
        <li><Link href="/explore">Explore Graph</Link></li>
        <li><a href="/#ask">Ask the Book</a></li>
        <li><a href="/#preorder" className={styles.cta}>Pre-order</a></li>
      </ul>
    </nav>
  )
}
