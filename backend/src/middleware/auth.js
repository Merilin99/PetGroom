import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

// Επαληθεύει το JWT από το header "Authorization: Bearer <token>"
// και βάζει τα στοιχεία του χρήστη στο req.user.
export function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return next(new ApiError(401, 'Απαιτείται σύνδεση'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Μη έγκυρο ή ληγμένο token'));
  }
}

// Περιορίζει ένα endpoint σε συγκεκριμένους ρόλους, π.χ. authorize('ADMIN').
// Χρησιμοποιείται πάντα ΜΕΤΑ το authenticate.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Απαιτείται σύνδεση'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Δεν έχεις δικαίωμα για αυτή την ενέργεια'));
    }
    next();
  };
}
