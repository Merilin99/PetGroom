import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const EMPTY = { name: '', description: '', durationMin: '', basePrice: '' };

export default function ServicesAdminPage() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setServices(await api('/services/all'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const body = {
      name: form.name,
      description: form.description || undefined,
      durationMin: Number(form.durationMin),
      basePrice: Number(form.basePrice),
    };
    try {
      if (editingId) {
        await api(`/services/${editingId}`, { method: 'PUT', body });
      } else {
        await api('/services', { method: 'POST', body });
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description ?? '',
      durationMin: String(s.durationMin),
      basePrice: String(s.basePrice),
    });
  }

  async function toggleActive(s) {
    setError('');
    try {
      await api(`/services/${s.id}`, { method: 'PUT', body: { isActive: !s.isActive } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Υπηρεσίες</h1>
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Επεξεργασία υπηρεσίας' : 'Νέα υπηρεσία'}</h2>
        <label>
          Όνομα
          <input required value={form.name} onChange={set('name')} />
        </label>
        <label>
          Διάρκεια (λεπτά)
          <input type="number" required min={5} step={5} value={form.durationMin} onChange={set('durationMin')} />
        </label>
        <label>
          Τιμή (€)
          <input type="number" required min={0} step="0.5" value={form.basePrice} onChange={set('basePrice')} />
        </label>
        <label className="full">
          Περιγραφή (προαιρετικό)
          <input value={form.description} onChange={set('description')} />
        </label>
        <div className="full actions">
          <button className="btn">{editingId ? 'Αποθήκευση' : 'Προσθήκη'}</button>
          {editingId && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setEditingId(null); setForm(EMPTY); }}
            >
              Άκυρο
            </button>
          )}
        </div>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Υπηρεσία</th>
              <th>Διάρκεια</th>
              <th>Τιμή</th>
              <th>Κατάσταση</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className={s.isActive ? '' : 'row-inactive'}>
                <td>
                  {s.name}
                  {s.description && <div className="muted small">{s.description}</div>}
                </td>
                <td>{s.durationMin}′</td>
                <td>{s.basePrice}€</td>
                <td>
                  <span className={`badge ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {s.isActive ? 'Ενεργή' : 'Ανενεργή'}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn btn-small btn-outline" onClick={() => startEdit(s)}>
                    Επεξεργασία
                  </button>
                  <button
                    className={`btn btn-small ${s.isActive ? 'btn-danger' : ''}`}
                    onClick={() => toggleActive(s)}
                  >
                    {s.isActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
