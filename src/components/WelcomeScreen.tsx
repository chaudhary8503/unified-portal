import { useEffect } from 'react';
import { OWNER_NAME } from '../auth';
import './WelcomeScreen.css';

const WELCOME_DURATION_MS = 1800;

interface WelcomeScreenProps {
  onDone: () => void;
}

/** Brief greeting shown right after a successful sign-in. */
function WelcomeScreen({ onDone }: WelcomeScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, WELCOME_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="welcome-screen" role="status">
      <img className="welcome-logo" src="/powerant-logo.jpg" alt="" />
      <h1 className="welcome-title">Welcome, {OWNER_NAME}</h1>
      <p className="welcome-sub">Loading today's overview…</p>
    </div>
  );
}

export default WelcomeScreen;
