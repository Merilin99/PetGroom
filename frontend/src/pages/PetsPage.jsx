import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const SPECIES_LABELS = { DOG: 'Σκύλος', CAT: 'Γάτα', OTHER: 'Άλλο' };
const SIZE_LABELS = { SMALL: 'Μικρό', MEDIUM: 'Μεσαίο', LARGE: 'Μεγάλο' };
const EMPTY = { name: '', species: 'DOG', breed: '', size: 'MEDIUM', notes: '' };

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setPets(await api('/pets'));
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
    try {
      if (editingId) {
        await api(`/pets/${editingId}`, { method: 'PUT', body: form });
      } else {
        await api('/pets', { method: 'POST', body: form });
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(pet) {
    setEditingId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      size: pet.size,
      notes: pet.notes ?? '',
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Σίγουρα θέλεις να διαγράψεις το κατοικίδιο;')) return;
    setError('');
    try {
      await api(`/pets/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Τα κατοικίδιά μου</h1>
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Επεξεργασία κατοικιδίου' : 'Νέο κατοικίδιο'}</h2>
        <label>
          Όνομα
          <input required value={form.name} onChange={set('name')} />
        </label>
        <label>
          Είδος
          <select value={form.species} onChange={set('species')}>
            {Object.entries(SPECIES_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Ράτσα (προαιρετικό)
          <input value={form.breed} onChange={set('breed')} />
        </label>
        <label>
          Μέγεθος
          <select value={form.size} onChange={set('size')}>
            {Object.entries(SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="full">
          Σημειώσεις (προαιρετικό)
          <input value={form.notes} onChange={set('notes')} placeholder="π.χ. φοβάται το σεσουάρ" />
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

      {pets.length === 0 ? (
        <p className="muted">Δεν έχεις καταχωρήσει κατοικίδια ακόμα.</p>
      ) : (
        <div className="cards">
          {pets.map((pet) => (
            <div key={pet.id} className="card pet-card">
              <h3>{pet.species === 'CAT' ? '🐱' : pet.species === 'DOG' ? '🐶' : '🐾'} {pet.name}</h3>
              <p>
                {SPECIES_LABELS[pet.species]}
                {pet.breed ? ` · ${pet.breed}` : ''} · {SIZE_LABELS[pet.size]}
              </p>
              {pet.notes && <p className="muted">{pet.notes}</p>}
              <div className="actions">
                <button className="btn btn-small btn-outline" onClick={() => startEdit(pet)}>
                  Επεξεργασία
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(pet.id)}>
                  Διαγραφή
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
