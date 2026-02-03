import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TournamentPage from './pages/TournamentPage'

function App() {
  return (
    <Routes>
      <Route path="/:date" element={<TournamentPage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App
