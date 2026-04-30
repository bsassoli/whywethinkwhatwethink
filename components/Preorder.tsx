import Image from 'next/image'
import styles from './Preorder.module.css'

export default function Preorder() {
  return (
    <section className={styles.section} id="preorder">
      <div className={styles.left}>
        <div className={styles.label}>Coming Soon</div>
        <h2 className={styles.title}>Begin to understand why you believe what you believe</h2>
        <p className={styles.body}>
          A book that will leave you looking at your own opinions differently — with more curiosity,
          more humility, and a more generous eye for the invisible forces that shaped everyone
          around you too.
        </p>
        <a href="#" className={styles.btn}>Pre-order the Book</a>
      </div>
      <div className={styles.right}>
        <div className={styles.coverWrap}>
          <Image
            src="/cover-upload.jpg"
            alt="Book cover"
            width={200}
            height={300}
            className={styles.cover}
          />
          <div className={styles.coming}>Turi Munthe · Publishing 2025</div>
        </div>
      </div>
    </section>
  )
}
