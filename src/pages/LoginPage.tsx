import { useState, type FormEvent } from 'react';
import { checkCredentials } from '../auth';
import './LoginPage.css';

interface LoginPageProps {
  onSuccess: () => void;
}

function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (checkCredentials(username, password)) {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  }

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={handleSubmit}>
        <img className="login-logo" src="/powerant-logo.jpg" alt="Powerant" />
        <h1 className="page-title">Powerant Portal</h1>
        <p className="page-sub">Sign in with the owner account to continue.</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(false);
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
        />

        {error && (
          <div className="login-error" role="alert">
            Incorrect username or password.
          </div>
        )}

        <button type="submit" className="login-submit">
          Sign in
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
