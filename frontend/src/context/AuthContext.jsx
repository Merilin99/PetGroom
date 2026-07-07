import { createContext, useContext, useState } from 'react';
import { api, setToken } from '../api/client.js';

// Κρατά τον συνδεδεμένο χρήστη σε state + localStorage,
// ώστε να επιβιώνει το refresh της σελίδας.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') ?? 'null')
  );

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(form) {
    await api('/auth/register', { method: 'POST', body: form });
    await login(form.email, form.password); // αυτόματη σύνδεση μετά την εγγραφή
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
