import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: 'admin@audit.local',
    password: 'Admin@12345'
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">A</div>

        <h1>Central Audit Log</h1>

        <p>
          Secure, searchable and traceable audit management.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
              required
            />
          </label>

          <button
            className="primary full"
            disabled={busy}
          >
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          New organisation?{' '}
          <Link to="/register">
            Register
          </Link>
        </div>

        <div className="demo-note">
          Demo admin: admin@audit.local / Admin@12345
        </div>
      </div>
    </div>
  );
}