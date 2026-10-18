import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { canOpenModule, loadSessionUser, signOut, type SessionUser } from './auth';
import Header, { type View } from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import { supabase } from './lib/supabase';
import { MODULES } from './modules';
import ActivityPage from './pages/ActivityPage';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import TeamPage from './pages/TeamPage';

type Screen = 'loading' | 'login' | 'welcome' | 'portal';

function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<View>('overview');
  const showPortal = useCallback(() => setScreen('portal'), []);

  // Restore an existing session on load (refresh keeps you signed in).
  useEffect(() => {
    let cancelled = false;
    loadSessionUser()
      .then(async (u) => {
        if (cancelled) return;
        if (u) {
          setUser(u);
          setScreen('portal');
        } else {
          await signOut(); // clears a session belonging to a deactivated account
          setScreen('login');
        }
      })
      .catch(() => !cancelled && setScreen('login'));

    // Session expired or signed out elsewhere → back to login.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('overview');
        setScreen('login');
      }
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  if (screen === 'loading') {
    return <div className="app-loading" role="status">Loading…</div>;
  }

  if (screen === 'login' || !user) {
    return (
      <LoginPage
        onSuccess={(u) => {
          setUser(u);
          setView('overview');
          setScreen('welcome');
        }}
      />
    );
  }

  if (screen === 'welcome') {
    return <WelcomeScreen name={user.displayName} onDone={showPortal} />;
  }

  const visibleModules = MODULES.filter((m) =>
    user.isOwner ? true : m.permissionModule !== null && canOpenModule(user, m.permissionModule),
  );

  // Team and Activity are owner-only.
  const activeView: View = user.isOwner ? view : 'overview';

  return (
    <div className="app-shell">
      <Header
        name={user.displayName}
        isOwner={user.isOwner}
        view={activeView}
        onNavigate={setView}
        onSignOut={() => {
          void signOut();
        }}
      />

      <main className="app-body">
        <div className="page">
          <div className="page-inner">
            {activeView === 'overview' && <OverviewPage modules={visibleModules} />}
            {activeView === 'team' && <TeamPage currentUserId={user.profile.user_id} />}
            {activeView === 'activity' && <ActivityPage />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
