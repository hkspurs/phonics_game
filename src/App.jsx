import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import SubjectGateway from './screens/SubjectGateway'
import HomeDashboard from './screens/HomeDashboard'
import MathHome from './screens/MathHome'
import MathDailyChallenge from './screens/MathDailyChallenge'
import MathTrainingGym from './screens/MathTrainingGym'
import MathMasteryMap from './screens/MathMasteryMap'
import MasteryMap from './screens/MasteryMap'
import DailyChallenge from './screens/DailyChallenge'
import RewardScreen from './screens/RewardScreen'
import BrainGamesIsland from './screens/BrainGamesIsland'
import AssignmentHub from './screens/AssignmentHub'
import SoundCatcher from './games/SoundCatcher'
import MemoryMatch from './games/MemoryMatch'
import SoundBalloonPop from './games/SoundBalloonPop'
import ParentDashboard from './screens/ParentDashboard'
import TrainingGym from './screens/TrainingGym'
import BubbleChallenge from './screens/BubbleChallenge'
import MascotRabbit from './components/MascotRabbit'

import { useGameStore } from './store/gameStore'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-container" style={{ background: '#fef2f2', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <MascotRabbit feedbackState="idle" style={{ width: '200px', height: '200px', transform: 'scale(1.5)', marginBottom: '2rem' }} />
          <h1 style={{ color: '#991b1b', marginBottom: '1rem', fontSize: '2.5rem' }}>Oops, let's try again! 🌟</h1>
          <p style={{ color: '#b91c1c', marginBottom: '2rem', fontSize: '1.5rem' }}>Something got a little mixed up.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => window.location.href = '/'}>
              🏠 Back to Home
            </button>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              🔄 Restart
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedParentRoute = ({ children }) => {
  const isParentAuthenticated = useGameStore(state => state.isParentAuthenticated);
  if (!isParentAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [hydrated, setHydrated] = useState(false);

  // QA FIX (Challenge 22): Hydration FOUC prevention
  useEffect(() => {
    const unsubHydrate = useGameStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useGameStore.persist.hasHydrated());
    return () => unsubHydrate();
  }, []);

  if (!hydrated) {
    return (
      <div className="screen-container" style={{ background: 'linear-gradient(135deg, #ecfdf5, #dbeafe)', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
         <div style={{ animation: 'pulse-glow 2s infinite', borderRadius: '50%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
            <MascotRabbit style={{ width: '200px', height: '200px' }} />
         </div>
         <h1 style={{ color: '#1e3a8a', fontSize: '2.5rem', marginTop: '2rem', animation: 'pulse 1.5s infinite' }}>Loading Adventure... 🚀</h1>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
      <Routes>
        <Route path="/" element={<SubjectGateway />} />
        <Route path="/phonics" element={<HomeDashboard />} />
        <Route path="/math" element={<MathHome />} />
        <Route path="/math/map" element={<MathMasteryMap />} />
        <Route path="/math/daily" element={<MathDailyChallenge />} />
        <Route path="/math/reward" element={<RewardScreen />} />
        <Route path="/math/gym" element={<MathTrainingGym />} />
        <Route path="/map" element={<MasteryMap />} />
        <Route path="/challenge" element={<DailyChallenge />} />
        <Route path="/reward" element={<RewardScreen />} />
        <Route path="/braingames" element={<BrainGamesIsland />} />
        <Route path="/games/soundcatcher" element={<SoundCatcher />} />
        <Route path="/games/memorymatch" element={<MemoryMatch />} />
        <Route path="/games/soundballoonpop" element={<SoundBalloonPop />} />
        <Route path="/gym" element={<TrainingGym />} />
        <Route path="/bubble" element={<BubbleChallenge />} />
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
    </ErrorBoundary>
  )
}

export default App

