import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ ...form, phone: form.phone || undefined });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>🐾 PetGroom</h1>
        <h2>Εγγραφή</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Όνομα
          <input required value={form.firstName} onChange={set('firstName')} />
        </label>
        <label>
          Επώνυμο
          <input required value={form.lastName} onChange={set('lastName')} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={set('email')} />
        </label>
        <label>
          Κωδικός (τουλάχιστον 8 χαρακτήρες)
          <input type="password" required minLength={8} value={form.password} onChange={set('password')} />
        </label>
        <label>
          Τηλέφωνο (προαιρετικό)
          <input value={form.phone} onChange={set('phone')} />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? 'Εγγραφή...' : 'Εγγραφή'}
        </button>
        <p className="muted">
          Έχεις ήδη λογαριασμό; <Link to="/login">Σύνδεση</Link>
        </p>
      </form>
    </div>
  );
}
