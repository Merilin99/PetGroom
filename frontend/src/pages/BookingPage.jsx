import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

// Ροή κράτησης: κατοικίδιο -> υπηρεσία -> groomer -> ημερομηνία -> διαθέσιμη ώρα.

export default function BookingPage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [form, setForm] = useState({ petId: '', serviceId: '', groomerId: '', date: '' });
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/pets'), api('/services'), api('/users/groomers')])
      .then(([p, s, g]) => {
        setPets(p);
        setServices(s);
        setGroomers(g);
      })
      .catch((err) => setError(err.message));
  }, []);

  const complete = form.serviceId && form.groomerId && form.date;

  // Κάθε φορά που αλλάζει υπηρεσία/groomer/ημερομηνία, φέρε τις ελεύθερες ώρες.
  useEffect(() => {
    if (!complete) {
      setAvailability(null);
      return;
    }
    setAvailability(null);
    api(`/appointments/availability?groomerId=${form.groomerId}&serviceId=${form.serviceId}&date=${form.date}`)
      .then(setAvailability)
      .catch((err) => setError(err.message));
  }, [form.serviceId, form.groomerId, form.date]);

  const set = (field) => (e) => {
    setError('');
    setForm({ ...form, [field]: e.target.value });
  };

  async function book(slot) {
    setError('');
    setBusy(true);
    try {
      await api('/appointments', {
        method: 'POST',
        body: {
          petId: Number(form.petId),
          serviceId: Number(form.serviceId),
          groomerId: Number(form.groomerId),
          startsAt: `${form.date} ${slot}`,
        },
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1>Νέο ραντεβού</h1>
      {error && <p className="error">{error}</p>}

      {pets.length === 0 ? (
        <p className="muted">
          Καταχώρησε πρώτα ένα κατοικίδιο στη σελίδα «Τα κατοικίδιά μου».
        </p>
      ) : (
        <div className="card form-grid">
          <label>
            Κατοικίδιο
            <select required value={form.petId} onChange={set('petId')}>
              <option value="">— επίλεξε —</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            Υπηρεσία
            <select required value={form.serviceId} onChange={set('serviceId')}>
              <option value="">— επίλεξε —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMin}′, {s.basePrice}€)
                </option>
              ))}
            </select>
          </label>
          <label>
            Groomer
            <select required value={form.groomerId} onChange={set('groomerId')}>
              <option value="">— επίλεξε —</option>
              {groomers.map((g) => (
                <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
              ))}
            </select>
          </label>
          <label>
            Ημερομηνία
            <input type="date" required min={today} value={form.date} onChange={set('date')} />
          </label>
        </div>
      )}

      {complete && form.petId && availability && (
        <div className="card">
          <h2>Διαθέσιμες ώρες</h2>
          {availability.slots.length === 0 ? (
            <p className="muted">Δεν υπάρχουν ελεύθερες ώρες αυτή την ημέρα — δοκίμασε άλλη.</p>
          ) : (
            <div className="slots">
              {availability.slots.map((slot) => (
                <button key={slot} className="btn btn-slot" disabled={busy} onClick={() => book(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
