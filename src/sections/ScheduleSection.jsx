import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './ScheduleSection.css'

const WARMUP_MINUTES = 5
const MATCH_MINUTES = 8
const START_HOUR = 10
const START_MINUTE = 0
const GROUP_MATCH_COUNT = 20 // 10 rounds × 2 matches

function getWinner(score) {
  if (!score) return null
  const [s1, s2] = score.split(':').map(Number)
  if (isNaN(s1) || isNaN(s2)) return null
  if (s1 > s2) return 'team1'
  if (s2 > s1) return 'team2'
  return null
}

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

function computeStandings(rounds, scoreMap) {
  const stats = {}

  rounds.forEach((round, ri) => {
    round.matches.forEach((match, mi) => {
      const matchIndex = ri * 2 + mi
      const scoreData = scoreMap[matchIndex]

      // Init teams
      for (const name of [match.team1, match.team2]) {
        if (!stats[name]) {
          stats[name] = { name, wins: 0, losses: 0, pointsFor: 0, pointsLost: 0, played: 0 }
        }
      }

      if (!scoreData?.score) return

      const [s1, s2] = scoreData.score.split(':').map(Number)
      if (isNaN(s1) || isNaN(s2)) return

      stats[match.team1].played++
      stats[match.team2].played++
      stats[match.team1].pointsFor += s1
      stats[match.team1].pointsLost += s2
      stats[match.team2].pointsFor += s2
      stats[match.team2].pointsLost += s1

      const winner = getWinner(scoreData.score)
      if (winner === 'team1') {
        stats[match.team1].wins++
        stats[match.team2].losses++
      } else if (winner === 'team2') {
        stats[match.team2].wins++
        stats[match.team1].losses++
      }
    })
  })

  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.pointsLost - b.pointsLost
  })
}

function ScoreInput({ matchIndex, currentScore, onSubmit, extraData }) {
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const [s1, s2] = (currentScore || '').split(':').map(Number)
    setScore1(isNaN(s1) ? '' : s1)
    setScore2(isNaN(s2) ? '' : s2)
  }, [currentScore])

  const handleSubmit = async () => {
    if (score1 === '' || score2 === '') return
    setSaving(true)
    await onSubmit(matchIndex, Number(score1), Number(score2), extraData)
    setSaving(false)
  }

  return (
    <div className="score-input-group">
      <input
        type="number"
        min="0"
        max="30"
        className="score-input"
        value={score1}
        onChange={(e) => setScore1(e.target.value)}
        placeholder="0"
      />
      <span className="score-colon">:</span>
      <input
        type="number"
        min="0"
        max="30"
        className="score-input"
        value={score2}
        onChange={(e) => setScore2(e.target.value)}
        placeholder="0"
      />
      <button
        className="score-save-btn"
        onClick={handleSubmit}
        disabled={saving || score1 === '' || score2 === ''}
      >
        {saving ? '...' : '存'}
      </button>
    </div>
  )
}

function ScoreDisplay({ score }) {
  if (!score) return <span className="score-empty">-</span>
  const winner = getWinner(score)
  return (
    <span className="score-display">
      <span className={winner === 'team1' ? 'score-winner' : 'score-loser'}>
        {score.split(':')[0]}
      </span>
      <span className="score-separator">:</span>
      <span className={winner === 'team2' ? 'score-winner' : 'score-loser'}>
        {score.split(':')[1]}
      </span>
    </span>
  )
}

export default function ScheduleSection({ data, scores, updateScore }) {
  const { schedule } = data
  const [searchParams] = useSearchParams()
  const isAdmin = searchParams.get('admin') === 'true'
  const [selectedTeam, setSelectedTeam] = useState(null)

  const timedRounds = useMemo(
    () => computeRoundTimings(schedule.rounds),
    [schedule.rounds]
  )

  const handleTeamClick = (teamName) => {
    setSelectedTeam((prev) => (prev === teamName ? null : teamName))
  }

  const lastRound = timedRounds[timedRounds.length - 1]

  // Build a map from matchIndex to score data
  const scoreMap = useMemo(() => {
    if (!scores) return {}
    const map = {}
    scores.forEach((s, i) => {
      map[i] = s
    })
    return map
  }, [scores])

  // Compute standings from group stage scores
  const standings = useMemo(
    () => computeStandings(schedule.rounds, scoreMap),
    [schedule.rounds, scoreMap]
  )

  const allGroupMatchesPlayed = standings.length > 0 && standings.every(t => t.played > 0)
  const top4 = standings.slice(0, 4)

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
          {timedRounds.map((round, ri) => {
            const roundHasSelected = selectedTeam && round.matches.some(
              (m) => m.team1 === selectedTeam || m.team2 === selectedTeam
            )
            const roundDimmed = selectedTeam && !roundHasSelected

            return (
              <div key={round.round} className={`round-card${roundDimmed ? ' round-card--dimmed' : ''}`}>
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
                  {round.matches.map((match, mi) => {
                    const matchIndex = ri * 2 + mi
                    const scoreData = scoreMap[matchIndex]
                    const hasScore = scoreData && scoreData.score
                    const winner = getWinner(scoreData?.score)
                    const matchHasSelected = selectedTeam && (match.team1 === selectedTeam || match.team2 === selectedTeam)
                    const matchDimmed = selectedTeam && !matchHasSelected

                    return (
                      <div key={mi} className={`match-row ${hasScore ? 'has-score' : ''}${matchHasSelected ? ' match-row--active' : ''}${matchDimmed ? ' match-row--dimmed' : ''}`}>
                        <span className="court-label">{match.court}</span>
                        <span
                          className={`match-team left team-clickable ${winner === 'team1' ? 'team-won' : winner === 'team2' ? 'team-lost' : ''}${selectedTeam === match.team1 ? ' team-selected' : ''}`}
                          onClick={() => handleTeamClick(match.team1)}
                        >
                          <TypeBadge type={match.team1Type} />
                          {match.team1}
                        </span>
                        <div className="match-score-area">
                          {isAdmin && updateScore ? (
                            <ScoreInput
                              matchIndex={matchIndex}
                              currentScore={scoreData?.score}
                              onSubmit={updateScore}
                            />
                          ) : hasScore ? (
                            <ScoreDisplay score={scoreData.score} />
                          ) : (
                            <span className="match-vs">VS</span>
                          )}
                        </div>
                        <span
                          className={`match-team right team-clickable ${winner === 'team2' ? 'team-won' : winner === 'team1' ? 'team-lost' : ''}${selectedTeam === match.team2 ? ' team-selected' : ''}`}
                          onClick={() => handleTeamClick(match.team2)}
                        >
                          {match.team2}
                          <TypeBadge type={match.team2Type} />
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Standings */}
      {standings.length > 0 && (
        <div className="schedule-phase">
          <div className="phase-header">
            <div className="phase-line" />
            <h3 className="phase-title">預賽排名</h3>
            <span className="phase-badge">即時更新</span>
            <div className="phase-line" />
          </div>
          <div className="standings-table">
            <div className="standings-header">
              <span className="standings-rank">#</span>
              <span className="standings-name">隊伍</span>
              <span className="standings-stat">勝</span>
              <span className="standings-stat">負</span>
              <span className="standings-stat">得分</span>
              <span className="standings-stat">失分</span>
            </div>
            {standings.map((team, i) => (
              <div key={team.name} className={`standings-row ${i < 4 ? 'qualified' : ''}`}>
                <span className="standings-rank">{i + 1}</span>
                <span className="standings-name">{team.name}</span>
                <span className="standings-stat win">{team.wins}</span>
                <span className="standings-stat">{team.losses}</span>
                <span className="standings-stat">{team.pointsFor}</span>
                <span className="standings-stat">{team.pointsLost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finals */}
      <div className="schedule-phase">
        <div className="phase-header">
          <div className="phase-line" />
          <h3 className="phase-title">決賽階段</h3>
          <span className="phase-badge final">21 分制</span>
          <span className="time-badge">11:35 開始</span>
          <div className="phase-line" />
        </div>

        <div className="finals-bracket">
          {schedule.finals.matches.map((match, mi) => {
            const finalMatchIndex = GROUP_MATCH_COUNT + mi
            const finalTeam1 = top4[mi === 0 ? 0 : 2]?.name || match.team1
            const finalTeam2 = top4[mi === 0 ? 1 : 3]?.name || match.team2
            const scoreData = scoreMap[finalMatchIndex]
            const hasScore = scoreData && scoreData.score
            const winner = getWinner(scoreData?.score)

            return (
              <div key={mi} className={`final-match ${mi === 0 ? 'championship' : ''}`}>
                <div className="final-round">{match.round}</div>
                <div className="final-teams">
                  <div className={`final-team ${winner === 'team1' ? 'final-won' : winner === 'team2' ? 'final-lost' : ''}`}>
                    <span className="seed">{allGroupMatchesPlayed ? finalTeam1 : match.team1}</span>
                  </div>
                  <div className="final-vs">
                    {isAdmin && updateScore ? (
                      <ScoreInput
                        matchIndex={finalMatchIndex}
                        currentScore={scoreData?.score}
                        onSubmit={updateScore}
                        extraData={allGroupMatchesPlayed ? { team1: finalTeam1, team2: finalTeam2 } : undefined}
                      />
                    ) : hasScore ? (
                      <ScoreDisplay score={scoreData.score} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8L22 12L18 16" />
                        <path d="M6 8L2 12L6 16" />
                      </svg>
                    )}
                  </div>
                  <div className={`final-team ${winner === 'team2' ? 'final-won' : winner === 'team1' ? 'final-lost' : ''}`}>
                    <span className="seed">{allGroupMatchesPlayed ? finalTeam2 : match.team2}</span>
                  </div>
                </div>
                <div className="final-points">{match.points} 分制</div>
              </div>
            )
          })}
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
