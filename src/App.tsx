import { useCallback, useState } from 'react';
import './App.css';
import { endSession, hasSession, startSession } from './auth';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';

type Screen = 'login' | 'welcome' | 'portal';

function App() {
  const [screen, setScreen] = useState<Screen>(() => (hasSession() ? 'portal' : 'login'));
  const showPortal = useCallback(() => setScreen('portal'), []);

  if (screen === 'login') {
    return (
      <LoginPage
        onSuccess={() => {
          startSession();
          setScreen('welcome');
        }}
      />
    );
  }

  if (screen === 'welcome') {
    return <WelcomeScreen onDone={showPortal} />;
  }

  return (
    <div className="app-shell">
      <Header
        onSignOut={() => {
          endSession();
          setScreen('login');
        }}
      />

      <main className="app-body">
        <div className="page">
          <div className="page-inner">
            <OverviewPage />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
