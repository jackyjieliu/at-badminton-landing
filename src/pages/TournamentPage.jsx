import { useParams } from 'react-router-dom'
import { tournaments } from '../data/tournaments'
import useSheetScores from '../hooks/useSheetScores'
import Navbar from '../components/Navbar'
import MusicPlayer from '../components/MusicPlayer'
import ShuttlecockBg from '../components/ShuttlecockBg'
import AnimatedSection from '../components/AnimatedSection'
import HeroSection from '../sections/HeroSection'
import RulesSection from '../sections/RulesSection'
import PrizesSection from '../sections/PrizesSection'
import PlayersSection from '../sections/PlayersSection'
import ScheduleSection from '../sections/ScheduleSection'
import MoreInfoSection from '../sections/MoreInfoSection'
import Footer from '../components/Footer'
import './TournamentPage.css'

export default function TournamentPage() {
  const { date } = useParams()
  const data = tournaments[date]
  const { scores, updateScore } = useSheetScores(data?.sheetScriptUrl)

  if (!data) {
    return (
      <div className="not-found">
        <h1>找不到比賽資料</h1>
        <p>日期 {date} 沒有對應的比賽</p>
      </div>
    )
  }

  return (
    <div className="tournament-page">
      <ShuttlecockBg />
      <Navbar title={data.title} />
      <MusicPlayer />

      <HeroSection data={data} />

      <AnimatedSection id="rules" className="section">
        <RulesSection data={data} />
      </AnimatedSection>

      <AnimatedSection id="prizes" className="section">
        <PrizesSection data={data} />
      </AnimatedSection>

      <AnimatedSection id="players" className="section">
        <PlayersSection data={data} />
      </AnimatedSection>

      <AnimatedSection id="schedule" className="section">
        <ScheduleSection data={data} scores={scores} updateScore={updateScore} />
      </AnimatedSection>

      <AnimatedSection id="more" className="section">
        <MoreInfoSection data={data} />
      </AnimatedSection>

      <Footer data={data} />
    </div>
  )
}
