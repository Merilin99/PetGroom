// Βοηθητική κλάση για errors με HTTP status (π.χ. throw new ApiError(404, 'Δεν βρέθηκε'))
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Το endpoint δεν υπάρχει' });
}

// Κεντρικός χειρισμός σφαλμάτων - όλα τα next(err) καταλήγουν εδώ
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Εσωτερικό σφάλμα διακομιστή' });
}
