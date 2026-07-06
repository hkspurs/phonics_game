import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomeDashboard from './screens/HomeDashboard'
import MasteryMap from './screens/MasteryMap'
import DailyChallenge from './screens/DailyChallenge'
import RewardScreen from './screens/RewardScreen'
import BrainGamesIsland from './screens/BrainGamesIsland'
import AssignmentHub from './screens/AssignmentHub'
import SoundCatcher from './games/SoundCatcher'
import ParentDashboard from './screens/ParentDashboard'

import { useGameStore } from './store/gameStore'

const ProtectedParentRoute = ({ children }) => {
  const isParentAuthenticated = useGameStore(state => state.isParentAuthenticated);
  if (!isParentAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

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
        <Route path="/parent" element={
          <ProtectedParentRoute>
            <ParentDashboard />
          </ProtectedParentRoute>
        } />
        {/* QA FIX: Catch-all route to prevent blank screens */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
