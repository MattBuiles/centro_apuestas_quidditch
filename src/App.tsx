import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const MatchesPage = lazy(() => import('./pages/MatchesPage'))
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage/index'))
const MatchResultDetail = lazy(() => import('./components/matches/MatchResultDetail'))
const TeamsPage = lazy(() => import('./pages/TeamsPage'))
const StandingsPage = lazy(() => import('./pages/StandingsPage'))
const HistoricalSeasonDetail = lazy(() => import('./pages/StandingsPage/HistoricalSeasonDetail'))
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'))
const BettingPage = lazy(() => import('./pages/BettingPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const RecoveryPage = lazy(() => import('./pages/RecoveryPage'))
// Footer pages
const AboutPage = lazy(() => import('./pages/AboutPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const WebSocketTest = lazy(() => import('./pages/WebSocketTest/WebSocketTest'))
const MatchSimulationTest = lazy(() => import('./pages/MatchSimulationTest/MatchSimulationTest'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="recovery" element={<RecoveryPage />} />          <Route path="matches" element={<MatchesPage />} />
          <Route path="matches/:matchId" element={<MatchDetailPage />} />
          <Route path="matches/:matchId/result" element={<MatchResultDetail />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="historical-seasons/:id" element={<HistoricalSeasonDetail />} />
          <Route path="results" element={<ResultsPage />} /><Route path="teams/:teamId" element={<TeamDetailPage />} />
          {/* Footer pages */}
          <Route path="about" element={<AboutPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="websocket-test" element={<WebSocketTest />} />
          <Route path="simulation-test" element={<MatchSimulationTest />} />
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="betting" element={<BettingPage />} />
            <Route path="betting/:matchId" element={<BettingPage />} />
            <Route path="account/*" element={<AccountPage />} />
          </Route>
          <Route path="*" element={<div>Page not found</div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App