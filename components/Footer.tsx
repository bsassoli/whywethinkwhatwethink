import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <div className={styles.brand}>Why We <span>Think</span> What We Think</div>
        <div>© 2025 Turi Munthe. All rights reserved.</div>
      </div>
      <div className={styles.links}>
        <a href="#">Press</a>
        <a href="#">Contact</a>
        <a href="#">Privacy</a>
      </div>
    </footer>
  )
}
