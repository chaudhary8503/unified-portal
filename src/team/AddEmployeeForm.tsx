import { useState, type FormEvent } from 'react';
import { createEmployee, passwordProblem, usernameProblem } from './api';
import { generatePassword } from './password';

interface AddEmployeeFormProps {
  onCancel: () => void;
  /** Called after the owner has seen the login details. */
  onCreated: (userId: string) => void | Promise<void>;
}

function AddEmployeeForm({ onCancel, onCreated }: AddEmployeeFormProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ userId: string; username: string; password: string } | null>(null);

  const nameProblem = fullName.trim() ? null : 'Enter the employee’s name.';
  const userProblem = usernameProblem(username);
  const passProblem = passwordProblem(password);
  const valid = !nameProblem && !userProblem && !passProblem;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createEmployee(fullName, username, password);
      setCreated({ userId: res.user_id, username: username.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the login.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1 className="page-title">Login created</h1>
            <p className="page-sub">Give these details to {fullName.trim()}. The password is not shown again.</p>
          </div>
        </div>
        <div className="card detail-card add-card">
          <div className="form-stack">
            <pre className="credentials">
              {`Username: ${created.username}\nPassword: ${created.password}`}
            </pre>
            <div className="notice notice-info">
              Next, choose which modules {fullName.trim()} can open and what they can do there. Until you tick
              something, they can sign in but see no modules.
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={() => void onCreated(created.userId)}>
                Set permissions →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button type="button" className="btn btn-link detail-back" onClick={onCancel}>
        ← Back to team
      </button>
      <div className="page-head">
        <div>
          <h1 className="page-title">Add employee</h1>
          <p className="page-sub">Creates a login. You choose their modules and permissions next.</p>
        </div>
      </div>

      <form className="card detail-card add-card" onSubmit={handleSubmit} noValidate>
        <div className="form-stack">
          <label className="field">
            <span>Full name</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            {touched && nameProblem && <span className="field-error">{nameProblem}</span>}
          </label>

          <label className="field">
            <span>Username</span>
            <input
              className="input mono"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. ali"
            />
            {touched && userProblem ? (
              <span className="field-error">{userProblem}</span>
            ) : (
              <span className="field-hint">What they type to sign in. Can’t be changed later.</span>
            )}
          </label>

          <div className="form-row">
            <label className="field">
              <span>Temporary password</span>
              <input
                className="input mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                spellCheck={false}
              />
            </label>
            <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>
              Generate
            </button>
          </div>
          {touched && passProblem && <span className="field-error">{passProblem}</span>}

          {error && <div className="notice notice-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create login'}
            </button>
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default AddEmployeeForm;
