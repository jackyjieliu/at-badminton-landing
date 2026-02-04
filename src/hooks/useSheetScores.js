import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_INTERVAL = 10000 // 10 seconds

export default function useSheetScores(scriptUrl) {
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const fetchScores = useCallback(async () => {
    if (!scriptUrl) return
    setLoading(true)
    try {
      const res = await fetch(scriptUrl)
      const data = await res.json()
      setScores(data.scores)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [scriptUrl])

  useEffect(() => {
    fetchScores()
    intervalRef.current = setInterval(fetchScores, REFRESH_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchScores])

  const updateScore = useCallback(async (matchIndex, score1, score2, { team1, team2 } = {}) => {
    if (!scriptUrl) return
    const score = `${score1}:${score2}`

    // Optimistic update
    setScores(prev => {
      if (!prev) return prev
      const next = [...prev]
      next[matchIndex] = { ...next[matchIndex], score }
      return next
    })

    const body = { matchIndex, score }
    if (team1) body.team1 = team1
    if (team2) body.team2 = team2

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch (err) {
      setError(err.message)
      // Refetch on error to get correct state
      fetchScores()
    }
  }, [scriptUrl, fetchScores])

  return { scores, loading, error, updateScore, refetch: fetchScores }
}
