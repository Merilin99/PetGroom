// Τεκμηρίωση OpenAPI 3 για το PetGroom API.
// Σερβίρεται στο /api/docs (Swagger UI) και /api/docs.json (raw JSON, π.χ. για import σε Postman).

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const list = (name) => ({ type: 'array', items: ref(name) });

const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const errorResponse = (description) => jsonResponse(description, ref('Error'));

const jsonBody = (name) => ({
  required: true,
  content: { 'application/json': { schema: ref(name) } },
});

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer' },
  description: 'Αναγνωριστικό εγγραφής',
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PetGroom API',
    version: '1.0.0',
    description:
      'REST API για σύστημα διαχείρισης pet grooming salon. ' +
      'Τελικό Project Coding Factory 10 (ΟΠΑ/AUEB). ' +
      'Τα προστατευμένα endpoints απαιτούν header `Authorization: Bearer <token>` (από το /api/auth/login).',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Τοπικό development' }],
  // Προεπιλογή: όλα απαιτούν JWT - τα δημόσια endpoints το παρακάμπτουν με security: [].
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Εγγραφή, σύνδεση, προφίλ' },
    { name: 'Services', description: 'Κατάλογος υπηρεσιών grooming' },
    { name: 'Pets', description: 'Κατοικίδια πελατών' },
    { name: 'Users', description: 'Διαχείριση χρηστών και λίστα groomers' },
    { name: 'Appointments', description: 'Διαθεσιμότητα και ραντεβού' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Εγγραφή νέου πελάτη (πάντα ρόλος CUSTOMER)',
        security: [],
        requestBody: jsonBody('RegisterInput'),
        responses: {
          201: jsonResponse('Ο χρήστης δημιουργήθηκε', ref('User')),
          400: errorResponse('Μη έγκυρα στοιχεία'),
          409: errorResponse('Το email χρησιμοποιείται ήδη'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Σύνδεση - επιστρέφει JWT token',
        security: [],
        requestBody: jsonBody('LoginInput'),
        responses: {
          200: jsonResponse('Επιτυχής σύνδεση', ref('LoginResponse')),
          401: errorResponse('Λάθος email ή κωδικός'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Προφίλ του συνδεδεμένου χρήστη',
        responses: {
          200: jsonResponse('Στοιχεία χρήστη', ref('User')),
          401: errorResponse('Απαιτείται σύνδεση'),
        },
      },
    },
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'Λίστα ενεργών υπηρεσιών',
        security: [],
        responses: { 200: jsonResponse('Λίστα υπηρεσιών', list('Service')) },
      },
      post: {
        tags: ['Services'],
        summary: 'Δημιουργία υπηρεσίας (μόνο ADMIN)',
        requestBody: jsonBody('ServiceInput'),
        responses: {
          201: jsonResponse('Η υπηρεσία δημιουργήθηκε', ref('Service')),
          400: errorResponse('Μη έγκυρα στοιχεία'),
          401: errorResponse('Απαιτείται σύνδεση'),
          403: errorResponse('Μόνο για ADMIN'),
        },
      },
    },
    '/api/services/all': {
      get: {
        tags: ['Services'],
        summary: 'Όλες οι υπηρεσίες, μαζί με τις ανενεργές (μόνο ADMIN)',
        responses: {
          200: jsonResponse('Πλήρης λίστα υπηρεσιών', list('Service')),
          403: errorResponse('Μόνο για ADMIN'),
        },
      },
    },
    '/api/services/{id}': {
      get: {
        tags: ['Services'],
        summary: 'Μία υπηρεσία',
        security: [],
        parameters: [idParam],
        responses: {
          200: jsonResponse('Η υπηρεσία', ref('Service')),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
      put: {
        tags: ['Services'],
        summary: 'Ενημέρωση υπηρεσίας (μόνο ADMIN) - δέχεται και μερικά πεδία',
        parameters: [idParam],
        requestBody: jsonBody('ServiceInput'),
        responses: {
          200: jsonResponse('Η ενημερωμένη υπηρεσία', ref('Service')),
          400: errorResponse('Μη έγκυρα στοιχεία'),
          403: errorResponse('Μόνο για ADMIN'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
      delete: {
        tags: ['Services'],
        summary: 'Απενεργοποίηση υπηρεσίας - soft delete (μόνο ADMIN)',
        parameters: [idParam],
        responses: {
          204: { description: 'Απενεργοποιήθηκε' },
          403: errorResponse('Μόνο για ADMIN'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
    },
    '/api/pets': {
      get: {
        tags: ['Pets'],
        summary: 'Τα κατοικίδια του συνδεδεμένου χρήστη (ADMIN: όλα)',
        responses: {
          200: jsonResponse('Λίστα κατοικιδίων', list('Pet')),
          401: errorResponse('Απαιτείται σύνδεση'),
        },
      },
      post: {
        tags: ['Pets'],
        summary: 'Καταχώρηση κατοικιδίου στον συνδεδεμένο χρήστη',
        requestBody: jsonBody('PetInput'),
        responses: {
          201: jsonResponse('Το κατοικίδιο καταχωρήθηκε', ref('Pet')),
          400: errorResponse('Μη έγκυρα στοιχεία'),
          401: errorResponse('Απαιτείται σύνδεση'),
        },
      },
    },
    '/api/pets/{id}': {
      get: {
        tags: ['Pets'],
        summary: 'Ένα κατοικίδιο (μόνο ιδιοκτήτης ή ADMIN)',
        parameters: [idParam],
        responses: {
          200: jsonResponse('Το κατοικίδιο', ref('Pet')),
          403: errorResponse('Δεν είναι δικό σου'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
      put: {
        tags: ['Pets'],
        summary: 'Ενημέρωση κατοικιδίου - δέχεται και μερικά πεδία (ιδιοκτήτης ή ADMIN)',
        parameters: [idParam],
        requestBody: jsonBody('PetInput'),
        responses: {
          200: jsonResponse('Το ενημερωμένο κατοικίδιο', ref('Pet')),
          400: errorResponse('Μη έγκυρα στοιχεία'),
          403: errorResponse('Δεν είναι δικό σου'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
      delete: {
        tags: ['Pets'],
        summary: 'Διαγραφή κατοικιδίου (ιδιοκτήτης ή ADMIN)',
        parameters: [idParam],
        responses: {
          204: { description: 'Διαγράφηκε' },
          403: errorResponse('Δεν είναι δικό σου'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
    },
    '/api/users/groomers': {
      get: {
        tags: ['Users'],
        summary: 'Λίστα groomers (id + όνομα) - για τη φόρμα κράτησης',
        responses: {
          200: jsonResponse('Λίστα groomers', list('Groomer')),
          401: errorResponse('Απαιτείται σύνδεση'),
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Λίστα χρηστών (μόνο ADMIN)',
        parameters: [
          {
            name: 'role',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['CUSTOMER', 'GROOMER', 'ADMIN'] },
            description: 'Προαιρετικό φίλτρο ρόλου',
          },
        ],
        responses: {
          200: jsonResponse('Λίστα χρηστών', list('User')),
          403: errorResponse('Μόνο για ADMIN'),
        },
      },
    },
    '/api/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Αλλαγή ρόλου χρήστη (μόνο ADMIN, όχι στον εαυτό του)',
        parameters: [idParam],
        requestBody: jsonBody('RoleInput'),
        responses: {
          200: jsonResponse('Ο ενημερωμένος χρήστης', ref('User')),
          400: errorResponse('Μη έγκυρος ρόλος ή αλλαγή στον εαυτό σου'),
          403: errorResponse('Μόνο για ADMIN'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
    },
    '/api/appointments/availability': {
      get: {
        tags: ['Appointments'],
        summary: 'Ελεύθερες ώρες ενός groomer για υπηρεσία και ημέρα',
        description: 'Slots ανά 30 λεπτά εντός ωραρίου 09:00-17:00, χωρίς επικαλύψεις με υπάρχοντα ραντεβού.',
        parameters: [
          { name: 'groomerId', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'serviceId', in: 'query', required: true, schema: { type: 'integer' } },
          {
            name: 'date',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date', example: '2026-07-10' },
          },
        ],
        responses: {
          200: jsonResponse('Διαθέσιμες ώρες', ref('Availability')),
          400: errorResponse('Μη έγκυρη ημερομηνία'),
          404: errorResponse('Groomer ή υπηρεσία δεν βρέθηκε'),
        },
      },
    },
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Λίστα ραντεβού - CUSTOMER: τα δικά του, GROOMER: το πρόγραμμά του, ADMIN: όλα',
        responses: {
          200: jsonResponse('Λίστα ραντεβού', list('Appointment')),
          401: errorResponse('Απαιτείται σύνδεση'),
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Κράτηση ραντεβού (με έλεγχο επικάλυψης σε transaction)',
        requestBody: jsonBody('AppointmentInput'),
        responses: {
          201: jsonResponse('Το ραντεβού δημιουργήθηκε', ref('Appointment')),
          400: errorResponse('Μη έγκυρα στοιχεία / εκτός ωραρίου / στο παρελθόν'),
          403: errorResponse('Το κατοικίδιο δεν είναι δικό σου'),
          404: errorResponse('Κατοικίδιο, υπηρεσία ή groomer δεν βρέθηκε'),
          409: errorResponse('Ο groomer ή το κατοικίδιο έχει ήδη ραντεβού εκείνη την ώρα'),
        },
      },
    },
    '/api/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Ένα ραντεβού (πελάτης του, groomer του ή ADMIN)',
        parameters: [idParam],
        responses: {
          200: jsonResponse('Το ραντεβού', ref('Appointment')),
          403: errorResponse('Δεν έχεις πρόσβαση'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
    },
    '/api/appointments/{id}/status': {
      patch: {
        tags: ['Appointments'],
        summary: 'Αλλαγή κατάστασης ραντεβού',
        description:
          'Μεταβάσεις: PENDING → CONFIRMED/CANCELLED, CONFIRMED → COMPLETED/CANCELLED. ' +
          'Ο πελάτης μπορεί μόνο να ακυρώσει - επιβεβαίωση/ολοκλήρωση κάνει ο groomer ή ο admin.',
        parameters: [idParam],
        requestBody: jsonBody('StatusInput'),
        responses: {
          200: jsonResponse('Το ενημερωμένο ραντεβού', ref('Appointment')),
          400: errorResponse('Μη έγκυρη μετάβαση κατάστασης'),
          403: errorResponse('Δεν έχεις δικαίωμα για αυτή την αλλαγή'),
          404: errorResponse('Δεν βρέθηκε'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Περιγραφή σφάλματος' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          email: { type: 'string', example: 'giorgos@test.gr' },
          firstName: { type: 'string', example: 'Γιώργος' },
          lastName: { type: 'string', example: 'Παπαδόπουλος' },
          phone: { type: 'string', nullable: true, example: '6941234567' },
          role: { type: 'string', enum: ['CUSTOMER', 'GROOMER', 'ADMIN'] },
          createdAt: { type: 'string', example: '2026-07-04 11:15:00' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', example: 'giorgos@test.gr' },
          password: { type: 'string', minLength: 8, example: 'kodikos123' },
          firstName: { type: 'string', example: 'Γιώργος' },
          lastName: { type: 'string', example: 'Παπαδόπουλος' },
          phone: { type: 'string', example: '6941234567' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'giorgos@test.gr' },
          password: { type: 'string', example: 'kodikos123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT για το header Authorization' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Groomer: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          firstName: { type: 'string', example: 'Νίκος' },
          lastName: { type: 'string', example: 'Γεωργίου' },
        },
      },
      RoleInput: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['CUSTOMER', 'GROOMER', 'ADMIN'] } },
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Πλήρες Grooming' },
          description: { type: 'string', nullable: true },
          durationMin: { type: 'integer', example: 90 },
          basePrice: { type: 'number', example: 55 },
          isActive: { type: 'integer', description: '1 ενεργή, 0 ανενεργή', example: 1 },
        },
      },
      ServiceInput: {
        type: 'object',
        required: ['name', 'durationMin', 'basePrice'],
        properties: {
          name: { type: 'string', example: 'Κόψιμο Νυχιών' },
          description: { type: 'string' },
          durationMin: { type: 'integer', example: 15 },
          basePrice: { type: 'number', example: 10 },
          isActive: { type: 'boolean', description: 'Μόνο στο PUT' },
        },
      },
      Pet: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          ownerId: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Ρεξ' },
          species: { type: 'string', enum: ['DOG', 'CAT', 'OTHER'] },
          breed: { type: 'string', nullable: true, example: 'Λαμπραντόρ' },
          size: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
          notes: { type: 'string', nullable: true, example: 'Φοβάται το σεσουάρ' },
          createdAt: { type: 'string', example: '2026-07-04 11:20:00' },
        },
      },
      PetInput: {
        type: 'object',
        required: ['name', 'species', 'size'],
        properties: {
          name: { type: 'string', example: 'Ρεξ' },
          species: { type: 'string', enum: ['DOG', 'CAT', 'OTHER'] },
          breed: { type: 'string', example: 'Λαμπραντόρ' },
          size: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
          notes: { type: 'string', example: 'Φοβάται το σεσουάρ' },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          startsAt: { type: 'string', example: '2026-07-10 10:00:00' },
          endsAt: { type: 'string', example: '2026-07-10 11:30:00' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
          notes: { type: 'string', nullable: true },
          petId: { type: 'integer', example: 1 },
          petName: { type: 'string', example: 'Ρεξ' },
          ownerId: { type: 'integer', example: 2 },
          ownerName: { type: 'string', example: 'Γιώργος Παπαδόπουλος' },
          serviceId: { type: 'integer', example: 2 },
          serviceName: { type: 'string', example: 'Πλήρες Grooming' },
          groomerId: { type: 'integer', example: 5 },
          groomerName: { type: 'string', example: 'Νίκος Γεωργίου' },
        },
      },
      AppointmentInput: {
        type: 'object',
        required: ['petId', 'serviceId', 'groomerId', 'startsAt'],
        properties: {
          petId: { type: 'integer', example: 1 },
          serviceId: { type: 'integer', example: 2 },
          groomerId: { type: 'integer', example: 5 },
          startsAt: {
            type: 'string',
            example: '2026-07-10 10:00',
            description: 'Μορφή YYYY-MM-DD HH:MM - το τέλος υπολογίζεται από τη διάρκεια της υπηρεσίας',
          },
          notes: { type: 'string' },
        },
      },
      StatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED'] },
        },
      },
      Availability: {
        type: 'object',
        properties: {
          date: { type: 'string', example: '2026-07-10' },
          groomerId: { type: 'integer', example: 5 },
          serviceId: { type: 'integer', example: 2 },
          durationMin: { type: 'integer', example: 90 },
          slots: {
            type: 'array',
            items: { type: 'string' },
            example: ['09:00', '09:30', '11:30'],
          },
        },
      },
    },
  },
};
