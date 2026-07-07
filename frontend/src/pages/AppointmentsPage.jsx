import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_LABELS = {
  PENDING: 'Σε αναμονή',
  CONFIRMED: 'Επιβεβαιωμένο',
  COMPLETED: 'Ολοκληρωμένο',
  CANCELLED: 'Ακυρωμένο',
};

// '2026-07-10 10:00:00' -> '10/07/2026 10:00'
function fmt(dt) {
  const [date, time] = dt.split(' ');
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y} ${time.slice(0, 5)}`;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setAppointments(await api('/appointments'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    setError('');
    try {
      await api(`/appointments/${id}/status`, { method: 'PATCH', body: { status } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function actions(a) {
    const buttons = [];
    if (user.role !== 'CUSTOMER') {
      if (a.status === 'PENDING') {
        buttons.push(
          <button key="c" className="btn btn-small" onClick={() => setStatus(a.id, 'CONFIRMED')}>
            Επιβεβαίωση
          </button>
        );
      }
      if (a.status === 'CONFIRMED') {
        buttons.push(
          <button key="d" className="btn btn-small" onClick={() => setStatus(a.id, 'COMPLETED')}>
            Ολοκλήρωση
          </button>
        );
      }
    }
    if (a.status === 'PENDING' || a.status === 'CONFIRMED') {
      buttons.push(
        <button key="x" className="btn btn-small btn-danger" onClick={() => setStatus(a.id, 'CANCELLED')}>
          Ακύρωση
        </button>
      );
    }
    return buttons;
  }

  return (
    <div>
      <h1>{user.role === 'GROOMER' ? 'Το πρόγραμμά μου' : 'Ραντεβού'}</h1>
      {error && <p className="error">{error}</p>}
      {appointments.length === 0 ? (
        <p className="muted">Δεν υπάρχουν ραντεβού.</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ημερομηνία & ώρα</th>
                <th>Κατοικίδιο</th>
                <th>Υπηρεσία</th>
                {user.role !== 'CUSTOMER' && <th>Πελάτης</th>}
                {user.role !== 'GROOMER' && <th>Groomer</th>}
                <th>Κατάσταση</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{fmt(a.startsAt)} – {a.endsAt.split(' ')[1].slice(0, 5)}</td>
                  <td>{a.petName}</td>
                  <td>{a.serviceName}</td>
                  {user.role !== 'CUSTOMER' && <td>{a.ownerName}</td>}
                  {user.role !== 'GROOMER' && <td>{a.groomerName}</td>}
                  <td>
                    <span className={`badge badge-${a.status.toLowerCase()}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="actions">{actions(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
