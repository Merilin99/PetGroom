import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = {
  CUSTOMER: [
    { to: '/', label: 'Τα ραντεβού μου' },
    { to: '/pets', label: 'Τα κατοικίδιά μου' },
    { to: '/booking', label: 'Νέο ραντεβού' },
  ],
  GROOMER: [{ to: '/', label: 'Το πρόγραμμά μου' }],
  ADMIN: [
    { to: '/', label: 'Ραντεβού' },
    { to: '/services', label: 'Υπηρεσίες' },
    { to: '/users', label: 'Χρήστες' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="brand">🐾 PetGroom</Link>
        <div className="nav-links">
          {LINKS[user.role].map(({ to, label }) => (
            <NavLink key={to} to={to} end>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="nav-user">
          <span>{user.firstName} ({user.role})</span>
          <button className="btn btn-outline" onClick={logout}>Αποσύνδεση</button>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
