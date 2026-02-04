import { useMemo } from 'react'
import './ScheduleSection.css'

const WARMUP_MINUTES = 5
const MATCH_MINUTES = 8
const START_HOUR = 10
const START_MINUTE = 0

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function TypeBadge({ type }) {
  return (
    <span className={`team-badge ${type === 'mixed' ? 'mixed' : 'mens'}`}>
      {type === 'mixed' ? '混' : '男'}
    </span>
  )
}

function computeRoundTimings(rounds) {
  const seenTeams = new Set()
  let clock = START_HOUR * 60 + START_MINUTE

  return rounds.map((round) => {
    // Find first-time teams in this round
    const newTeams = []
    for (const match of round.matches) {
      if (!seenTeams.has(match.team1)) newTeams.push(match.team1)
      if (!seenTeams.has(match.team2)) newTeams.push(match.team2)
    }

    const hasWarmup = newTeams.length > 0

    const warmupStart = hasWarmup ? clock : null
    if (hasWarmup) clock += WARMUP_MINUTES

    const matchStart = clock
    clock += MATCH_MINUTES
    const matchEnd = clock

    // Mark teams as seen
    for (const match of round.matches) {
      seenTeams.add(match.team1)
      seenTeams.add(match.team2)
    }

    return {
      ...round,
      hasWarmup,
      warmupStart: warmupStart !== null ? formatTime(warmupStart) : null,
      matchStart: formatTime(matchStart),
      matchEnd: formatTime(matchEnd),
      newTeams,
    }
  })
}

export default function ScheduleSection({ data }) {
  const { schedule } = data

  const timedRounds = useMemo(
    () => computeRoundTimings(schedule.rounds),
    [schedule.rounds]
  )

  const lastRound = timedRounds[timedRounds.length - 1]

  return (
    <div className="container">
      <div className="section-header">
        <span className="section-tag">Schedule</span>
        <h2 className="section-title">賽程</h2>
        <p className="section-subtitle">{schedule.format}・{schedule.courts} 面場地</p>
      </div>

      {/* Round-by-round matches */}
      <div className="schedule-phase">
        <div className="phase-header">
          <div className="phase-line" />
          <h3 className="phase-title">預賽對戰表</h3>
          <span className="phase-badge">15 分制</span>
          <div className="phase-line" />
        </div>

        <div className="schedule-meta">
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>開始 {formatTime(START_HOUR * 60 + START_MINUTE)}</span>
          </div>
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2 2 4-4" />
              <path d="M19 13l2 2-4 4" />
            </svg>
            <span>每場 {MATCH_MINUTES} 分鐘</span>
          </div>
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>首次上場熱身 {WARMUP_MINUTES} 分鐘</span>
          </div>
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>預計 {lastRound.matchEnd} 結束預賽</span>
          </div>
        </div>

        <div className="rounds-list">
          {timedRounds.map((round) => (
            <div key={round.round} className="round-card">
              <div className="round-header">
                <span className="round-number">R{round.round}</span>
                <div className="round-time-info">
                  {round.hasWarmup && (
                    <span className="warmup-badge">
                      {round.warmupStart} 熱身
                    </span>
                  )}
                  <span className="time-badge">
                    {round.matchStart} 開始
                  </span>
                </div>
              </div>
              {round.hasWarmup && (
                <div className="warmup-note">
                  首次上場：{round.newTeams.join('、')}
                </div>
              )}
              <div className="round-matches">
                {round.matches.map((match, mi) => (
                  <div key={mi} className="match-row">
                    <span className="court-label">{match.court}</span>
                    <span className="match-team left">
                      <TypeBadge type={match.team1Type} />
                      {match.team1}
                    </span>
                    <span className="match-vs">VS</span>
                    <span className="match-team right">
                      {match.team2}
                      <TypeBadge type={match.team2Type} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Finals */}
      <div className="schedule-phase">
        <div className="phase-header">
          <div className="phase-line" />
          <h3 className="phase-title">決賽階段</h3>
          <span className="phase-badge final">21 分制</span>
          <span className="time-badge">11:40 開始</span>
          <div className="phase-line" />
        </div>

        <div className="finals-bracket">
          {schedule.finals.matches.map((match, mi) => (
            <div key={mi} className={`final-match ${mi === 0 ? 'championship' : ''}`}>
              <div className="final-round">{match.round}</div>
              <div className="final-teams">
                <div className="final-team">
                  <span className="seed">{match.team1}</span>
                </div>
                <div className="final-vs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8L22 12L18 16" />
                    <path d="M6 8L2 12L6 16" />
                  </svg>
                </div>
                <div className="final-team">
                  <span className="seed">{match.team2}</span>
                </div>
              </div>
              <div className="final-points">{match.points} 分制</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline visual */}
      <div className="schedule-flow">
        <div className="flow-step">
          <div className="flow-dot active" />
          <span>預賽 {timedRounds.length} 輪</span>
        </div>
        <div className="flow-connector" />
        <div className="flow-step">
          <div className="flow-dot" />
          <span>勝場排序</span>
        </div>
        <div className="flow-connector" />
        <div className="flow-step">
          <div className="flow-dot" />
          <span>前四晉級</span>
        </div>
        <div className="flow-connector" />
        <div className="flow-step">
          <div className="flow-dot final" />
          <span>決賽</span>
        </div>
      </div>
    </div>
  )
}
