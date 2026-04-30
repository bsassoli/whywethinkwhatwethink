import Image from 'next/image'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`${styles.left} fade-up visible`}>
        <div className={styles.eyebrow}>A New Book by Turi Munthe</div>
        <h1 className={styles.title}>
          <span className={styles.red}>Why</span> We Think<br />
          <span className={styles.red}>What</span> We Think
        </h1>
        <p className={styles.subtitle}>The unexpected origins of our deepest beliefs</p>
        <p className={styles.thesis}>
          Our opinions are shaped less by reason than by an invisible web of forces —
          climate, geology, culture, biology, and genetics. Recognising this should make
          us more humble about our own views, and more empathetic toward those who hold
          different ones.
        </p>
        <div className={styles.actions}>
          <a href="#preorder" className={styles.btnPrimary}>Pre-order Now</a>
          <a href="/explore" className={styles.btnSecondary}>Explore the Ideas</a>
        </div>
        <div className={styles.blurb}>
          <p className={styles.blurbQuote}>&lsquo;This book is always fascinating but frequently mind-blowing&rsquo;</p>
          <span className={styles.blurbAttr}>Marina Hyde</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.circle} />
        <div className={`${styles.circle} ${styles.circle2}`} />
        <div className={styles.coverWrap}>
          <Image
            src="/cover-upload.jpg"
            alt="Why We Think What We Think — book cover"
            width={320}
            height={480}
            priority
            className={styles.cover}
          />
          <div className={styles.coverShadow} />
        </div>
      </div>
    </section>
  )
}
