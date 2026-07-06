import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import HomeDashboard from './screens/HomeDashboard'
import MasteryMap from './screens/MasteryMap'
import DailyChallenge from './screens/DailyChallenge'
import RewardScreen from './screens/RewardScreen'
import BrainGamesIsland from './screens/BrainGamesIsland'
import AssignmentHub from './screens/AssignmentHub'
import SoundCatcher from './games/SoundCatcher'
import ParentDashboard from './screens/ParentDashboard'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/map" element={<MasteryMap />} />
        <Route path="/challenge" element={<DailyChallenge />} />
        <Route path="/reward" element={<RewardScreen />} />
        <Route path="/braingames" element={<BrainGamesIsland />} />
        <Route path="/games/soundcatcher" element={<SoundCatcher />} />
        <Route path="/assignments" element={<AssignmentHub />} />
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </HashRouter>
  )
}

export default App
