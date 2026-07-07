import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = ['CUSTOMER', 'GROOMER', 'ADMIN'];

export default function UsersAdminPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setUsers(await api('/users'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id, role) {
    setError('');
    try {
      await api(`/users/${id}/role`, { method: 'PUT', body: { role } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Χρήστες</h1>
      {error && <p className="error">{error}</p>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ονοματεπώνυμο</th>
              <th>Email</th>
              <th>Τηλέφωνο</th>
              <th>Ρόλος</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.phone ?? '—'}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={u.id === me.id} // ο admin δεν αλλάζει τον δικό του ρόλο
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
