import styles from './Chapters.module.css'

interface ChapterData {
  num: string
  tag: string
  title: string
  excerpt: string
}

interface Props {
  chapters: ChapterData[]
}

export default function Chapters({ chapters }: Props) {
  return (
    <section className={styles.section} id="chapters">
      <div className={styles.header}>
        <div className={styles.label}>Inside the Book</div>
        <h2 className={styles.title}>A journey through the unexpected origins of belief</h2>
      </div>
      <div className={styles.grid}>
        {chapters.map((ch, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.ghostNum}>{ch.num}</div>
            <div className={styles.tag}>{ch.tag}</div>
            <h3 className={styles.chTitle}>{ch.title}</h3>
            <p className={styles.excerpt}>{ch.excerpt}</p>
            <span className={styles.readMore}>Read more →</span>
          </div>
        ))}
      </div>
    </section>
  )
}
