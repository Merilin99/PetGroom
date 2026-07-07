import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import PetsPage from './pages/PetsPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ServicesAdminPage from './pages/ServicesAdminPage.jsx';
import UsersAdminPage from './pages/UsersAdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<AppointmentsPage />} />
        <Route
          path="/pets"
          element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><PetsPage /></ProtectedRoute>}
        />
        <Route
          path="/booking"
          element={<ProtectedRoute roles={['CUSTOMER']}><BookingPage /></ProtectedRoute>}
        />
        <Route
          path="/services"
          element={<ProtectedRoute roles={['ADMIN']}><ServicesAdminPage /></ProtectedRoute>}
        />
        <Route
          path="/users"
          element={<ProtectedRoute roles={['ADMIN']}><UsersAdminPage /></ProtectedRoute>}
        />
      </Route>
    </Routes>
  );
}
