import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { tournaments } from '../data/tournaments'
import ShuttlecockBg from '../components/ShuttlecockBg'
import './HomePage.css'

function getTodayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function TournamentCard({ dateKey, data }) {
  return (
    <Link to={`/${dateKey}`} className="tournament-card">
      <div className="tc-glow" />
      <div className="tc-header">
        <span className="tc-date">{data.date}</span>
        <span className="tc-badge">{data.teams.length} 隊</span>
      </div>
      <h3 className="tc-title">{data.title}</h3>
      <p className="tc-subtitle">{data.subtitle}</p>
      <div className="tc-info">
        <span>{data.schedule.format}</span>
        <span>報名費 {data.entryFee} 元</span>
      </div>
      <div className="tc-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div className="card-corner top-right" />
      <div className="card-corner bottom-left" />
    </Link>
  )
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const today = getTodayString()

  const { upcoming, past } = useMemo(() => {
    const entries = Object.entries(tournaments)
    const upcoming = entries.filter(([key]) => key >= today).sort(([a], [b]) => a.localeCompare(b))
    const past = entries.filter(([key]) => key < today).sort(([a], [b]) => b.localeCompare(a))
    return { upcoming, past }
  }, [today])

  return (
    <div className="home-page">
      <ShuttlecockBg />

      {/* Hero */}
      <section className="home-hero">
        <div className="hero-glow" />
        <div className="hero-glow-secondary" />

        <svg className="court-lines" viewBox="0 0 1200 600" fill="none" aria-hidden="true">
          <rect x="100" y="50" width="1000" height="500" stroke="rgba(0,240,255,0.08)" strokeWidth="2" />
          <line x1="600" y1="50" x2="600" y2="550" stroke="rgba(0,240,255,0.06)" strokeWidth="2" />
          <line x1="100" y1="300" x2="1100" y2="300" stroke="rgba(0,240,255,0.04)" strokeWidth="1" strokeDasharray="8 4" />
          <rect x="250" y="130" width="700" height="340" stroke="rgba(0,240,255,0.05)" strokeWidth="1" />
        </svg>

        <div className={`hero-content ${loaded ? 'visible' : ''}`}>
          <h1 className="hero-title">
            <span className="title-line title-at">AT</span>
            <span className="title-line title-main">羽球盃</span>
          </h1>
          <p className="home-hero-desc">AT 羽球社內部友誼賽</p>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
        </div>
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Upcoming</span>
              <h2 className="section-title">正在進行</h2>
            </div>
            <div className="tournament-grid">
              {upcoming.map(([key, data]) => (
                <TournamentCard key={key} dateKey={key} data={data} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Archive</span>
              <h2 className="section-title">歷年比賽</h2>
            </div>
            <div className="tournament-grid">
              {past.map(([key, data]) => (
                <TournamentCard key={key} dateKey={key} data={data} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
