import { useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getErrorMessage } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    companyName: '',
    registrationNumber: '',
    companyEmail: '',
      phone: '',
    name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const change = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setDone('');

    try {
      const response = await api.post('/auth/register', form);

      setDone(
        response.data.message || 'Registration submitted.'
      );

      setForm({
        companyName: '',
        registrationNumber: '',
        companyEmail: '',
        phone: '',
        name: '',
        email: '',
        password: ''
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-logo">A</div>

        <h1>Register organisation</h1>

        <p>
          Submit your company for approval and create the
          first company administrator.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {done && (
          <div className="alert success">
            {done}{' '}
            <Link to="/login">
              Go to login
            </Link>
          </div>
        )}

        <form onSubmit={submit} className="form-grid">
          <label>
            Company name
            <input
              name="companyName"
              value={form.companyName}
              onChange={change}
              required
            />
          </label>

          <label>
            Registration number
            <input
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={change}
              required
            />
          </label>

          <label>
            Company email
            <input
              type="email"
              name="companyEmail"
              value={form.companyEmail}
              onChange={change}
              required
            />
          </label>

          <label>
            Administrator name
            <input
              name="name"
              value={form.name}
              onChange={change}
              required
            />
          </label>

          <label>
            Administrator email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              required
            />
          </label>
          <label>
  Company phone
  <input
    type="tel"
    name="phone"
    value={form.phone}
    onChange={change}
    required
  />
</label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={change}
              minLength="8"
              required
            />
          </label>

          <button
            className="primary full span-2"
            type="submit"
          >
            Submit registration
          </button>
        </form>

        <div className="auth-foot">
          Already registered?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
