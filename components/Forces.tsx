'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './Forces.module.css'

const FORCES = [
  {
    id: 'climate',
    icon: '☁',
    name: 'Climate & Disease',
    teaser: 'How the sky above us shapes the mind within us',
    detail: 'Temperature, rainfall, and pathogen density have profoundly shaped human psychology and political belief over millennia. Populations in disease-rich environments evolved cultural norms of conformity and distrust of outsiders as a form of behavioural immunity — a non-biological defence against contagion.',
    examples: [
      { title: 'Pathogen prevalence', body: 'High pathogen density predicts authoritarianism, social conservatism, and collectivism across cultures — conformity is protective when disease is rife.' },
      { title: 'Moralising high gods', body: 'Omniscient judgemental deities emerged in drought zones where cooperative farming required supernatural enforcement of social contracts.' },
      { title: 'Climate variability', body: 'Higher climate variability correlates with cultural adaptability — and with faster assimilation of immigrant populations.' },
    ]
  },
  {
    id: 'geology',
    icon: '⛰',
    name: 'Geography & Soil',
    teaser: 'Mountains, rivers and coastlines as architects of thought',
    detail: 'The physical landscape — its geology, topography, soil composition and food staples — has channelled the development of civilisations, social structures and political systems. The rock beneath our feet determines, centuries later, how we vote.',
    examples: [
      { title: 'The Black Belt', body: 'Democratic voting patterns in the American South trace almost exactly to ancient Cretaceous seabed: where soil was richest, slavery most entrenched, politics most liberal today.' },
      { title: 'Granite vs limestone', body: 'André Siegfried found that the Vendée\'s political character divided precisely along its geology — granite villages voted differently from limestone ones for 200 years.' },
      { title: 'Rice theory', body: 'Rice farming requires large-scale cooperation, producing collectivist East Asian cultures. Wheat and herding do not — producing individualist Western ones.' },
    ]
  },
  {
    id: 'culture',
    icon: '◎',
    name: 'Culture & Language',
    teaser: 'The water we swim in, invisible until we step out',
    detail: 'Culture is the most pervasive shaper of thought — a vast inherited system of assumptions, metaphors, and values absorbed before we are old enough to question them. It shapes not just what we believe but the very categories through which we perceive reality.',
    examples: [
      { title: 'Paradigm blindness', body: 'We cannot perceive our own cultural framework because it is the medium through which everything is perceived. Culture is not what we see — it\'s what we see with.' },
      { title: 'The aquarium study', body: 'Americans describe the focal fish; Japanese describe the whole environment — the same image, but culture determines what counts as the subject.' },
      { title: 'Müller-Lyer illusion', body: 'People raised in "carpentered" (rectangular) environments are deceived by this optical illusion; those from circular-hut cultures are not. Culture changes perception.' },
    ]
  },
  {
    id: 'biology',
    icon: '⬡',
    name: 'Neurology & Body',
    teaser: 'The ancient wiring still steering our beliefs',
    detail: 'Conservatives and liberals have measurably different brains: enlarged right amygdalae and heightened disgust sensitivity predict conservative leanings; larger anterior cingulate cortices and tolerance for ambiguity predict liberal ones. Our politics are, partly, visible in our faces.',
    examples: [
      { title: 'Conservative brain complex', body: 'Enlarged right amygdala + heightened disgust sensitivity + threat-focused attention form a neurological cluster that reliably predicts conservative political orientation.' },
      { title: 'Disgust and morality', body: 'In a room sprayed with fart spray, moral judgements become harsher — physical disgust amplifies moral condemnation. Higher baseline disgust predicts conservatism.' },
      { title: 'Faces and politics', body: 'An off-the-shelf AI predicted political orientation from profile photos at 72% accuracy. Upper-body strength predicts support for redistribution policies.' },
    ]
  },
  {
    id: 'genetics',
    icon: '◈',
    name: 'Genetics',
    teaser: 'Written in the body before the mind has a chance to speak',
    detail: 'Twin studies reveal that approximately 60% of the variance in political orientation is genetic. Personality traits linked to political belief — openness, conscientiousness, threat sensitivity — are substantially heritable. Our DNA is not destiny, but it is a disposition.',
    examples: [
      { title: 'MISTRA twin study', body: '56+ identical twin pairs reared apart: genes have "pronounced and pervasive" influence on political orientation; the shared environment effect is near zero.' },
      { title: 'Nature via nurture', body: 'Genes don\'t determine politics directly — they predispose personality traits that, through feedback loops with environment, produce political outlooks.' },
      { title: 'Body odour study', body: 'We are sexually attracted to the smell of co-partisans. Conservatives especially disliked the scent of liberals — the body knows before the mind does.' },
    ]
  },
  {
    id: 'emotion',
    icon: '⌛',
    name: 'Emotion & Society',
    teaser: 'Feeling is not opposed to thinking — it is thinking',
    detail: 'Emotion is not the enemy of reason but constitutive of it. Without feeling, we make catastrophically bad decisions. Fear, loneliness, disgust, and anger don\'t merely colour our views — they generate them. Loneliness is the dominant political emotion of our era.',
    examples: [
      { title: 'Elliot\'s case', body: 'After prefrontal damage, Elliot retained perfect reasoning but lost decision-making capacity. Damasio\'s conclusion: emotion is not opposed to reason — it is its substrate.' },
      { title: 'Loneliness and radicalisation', body: 'Loneliness kills empathy, breeds aggression, and is the single strongest predictor of authoritarian and extremist political attachment.' },
      { title: 'Social function of belief', body: 'Many of our most fiercely held views are held not because they are true but because they signal belonging, assert status, or manage anxiety.' },
    ]
  },
]

function ForceCard({ force, isActive, onClick }: {
  force: typeof FORCES[0]
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div>
        <div className={styles.icon}>{force.icon}</div>
        <div className={styles.name}>{force.name}</div>
        <div className={styles.teaser}>{force.teaser}</div>
      </div>
      <div className={styles.arrow}>→</div>
    </div>
  )
}

function ForceDetail({ force }: { force: typeof FORCES[0] }) {
  return (
    <div className={styles.detail}>
      <div>
        <div className={styles.detailTitle}>{force.icon} {force.name}</div>
        <p className={styles.detailBody}>{force.detail}</p>
      </div>
      <div>
        <h4 className={styles.detailEyebrow}>How it shapes us</h4>
        {force.examples.map((ex, i) => (
          <div key={i} className={styles.example}>
            <strong>{ex.title}</strong>
            {ex.body}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Forces() {
  const [active, setActive] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) e.target.classList.add('visible') },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const toggle = (id: string) => setActive(prev => prev === id ? null : id)
  const activeForce = FORCES.find(f => f.id === active)

  return (
    <section className={styles.section} id="forces">
      <div className={`${styles.header} fade-up`} ref={ref}>
        <div>
          <div className={styles.label}>The Invisible Web</div>
          <h2 className={styles.title}>Six forces that shape your thinking</h2>
        </div>
        <p className={styles.intro}>
          Long before you formed your first conscious opinion, these forces were already at work —
          assembling the architecture of what would feel, to you, like your own free thought.
          Click each to explore.
        </p>
      </div>
      <div className={styles.grid}>
        {FORCES.map(f => (
          <ForceCard
            key={f.id}
            force={f}
            isActive={active === f.id}
            onClick={() => toggle(f.id)}
          />
        ))}
      </div>
      {activeForce && <ForceDetail force={activeForce} />}
    </section>
  )
}
