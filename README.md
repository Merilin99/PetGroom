# PetGroom 🐾

Σύστημα διαχείρισης pet grooming salon — Τελικό Project **Coding Factory 10 (ΟΠΑ/AUEB)**.

Οι πελάτες καταχωρούν τα κατοικίδιά τους και κλείνουν ραντεβού για υπηρεσίες περιποίησης
(μπάνιο, κούρεμα, νύχια κ.λπ.). Οι groomers βλέπουν το πρόγραμμά τους και ο διαχειριστής
διαχειρίζεται υπηρεσίες, χρήστες και ραντεβού.

## Τεχνολογίες

| Επίπεδο | Τεχνολογία |
|---|---|
| Backend | Node.js + Express (REST API) |
| Βάση δεδομένων | MySQL 8 (raw SQL μέσω `mysql2`, χωρίς ORM) |
| Frontend | React 19 + React Router (build tool/dev server: **Vite**) |
| Authentication | JWT + bcrypt, role-based authorization (CUSTOMER / GROOMER / ADMIN) |
| Τεκμηρίωση API | Swagger |
| Υποδομή | Docker Compose |

## Domain Model (ERD)

Η βάση δεδομένων παράγεται από το domain model (`db/schema.sql`):

```
User (CUSTOMER/GROOMER/ADMIN)
 │ 1
 ├──────< N  Pet (όνομα, είδος, ράτσα, μέγεθος)
 │                │ 1
 │                └──────< N  Appointment (έναρξη, λήξη, κατάσταση)
 │ 1 (groomer)                 │ N
 └──────< N ──────────────────┘
                               │ N
        Service (όνομα, διάρκεια, τιμή)  1 ────┘
```

- Ένας **User** με ρόλο CUSTOMER έχει πολλά **Pets**.
- Κάθε **Appointment** συνδέει ένα Pet, μία Service και έναν groomer (User).
- Το service layer ελέγχει ότι τα ραντεβού ενός groomer **δεν επικαλύπτονται** χρονικά.

## Ρόλοι χρηστών

| Ρόλος | Πώς αποκτάται | Τι μπορεί να κάνει |
|---|---|---|
| **CUSTOMER** | Με εγγραφή από τη σελίδα Register — κάθε νέος λογαριασμός ξεκινά ως πελάτης | Διαχειρίζεται τα κατοικίδιά του, κλείνει και ακυρώνει ραντεβού |
| **GROOMER** | **Δεν υπάρχει απευθείας εγγραφή**: ο χρήστης εγγράφεται πρώτα κανονικά (ως CUSTOMER) και μετά ο admin τον προάγει από τη σελίδα **«Χρήστες»** | Βλέπει το πρόγραμμά του, επιβεβαιώνει/ολοκληρώνει/ακυρώνει τα ραντεβού του |
| **ADMIN** | Μόνο με το script `create-admin` (δεν γίνεται από το UI) | Όλα: υπηρεσίες, χρήστες/ρόλοι, όλα τα ραντεβού και κατοικίδια |

> **Σημείωση για την πρώτη εγκατάσταση:** μια φρέσκια βάση δεν έχει κανέναν groomer,
> οπότε η φόρμα κράτησης δεν θα έχει επιλογές στο πεδίο «Groomer». Η σωστή σειρά είναι:
> 1) δημιουργείς admin με το script, 2) ο μελλοντικός groomer κάνει εγγραφή,
> 3) ο admin τον προάγει σε GROOMER από τη σελίδα «Χρήστες» — από εκεί και πέρα
> οι πελάτες μπορούν να κλείνουν ραντεβού μαζί του.

## Δομή project

```
.
├── docker-compose.yml      # MySQL 8 (η ΒΔ αρχικοποιείται από τα db/*.sql)
├── db/
│   ├── schema.sql          # Σχήμα ΒΔ - παράγεται από το domain model
│   └── seed.sql            # Αρχικά δεδομένα (υπηρεσίες)
├── backend/
│   └── src/
│       ├── server.js       # Εκκίνηση server
│       ├── app.js          # Express app, middleware, routes
│       ├── config/         # Σύνδεση ΒΔ (mysql2 pool)
│       ├── routes/         # Ορισμός endpoints
│       ├── controllers/    # HTTP layer - χωρίς business logic
│       ├── services/       # Business logic - χωρίς HTTP/SQL
│       ├── repositories/   # Πρόσβαση δεδομένων - όλο το SQL ζει εδώ
│       └── middleware/     # Auth, χειρισμός σφαλμάτων
└── frontend/               # React app (Vite)
    └── src/
        ├── api/            # fetch wrapper με JWT
        ├── context/        # AuthContext (χρήστης + token)
        ├── components/     # Layout, ProtectedRoute
        └── pages/          # Login, Register, Ραντεβού, Κατοικίδια, Κράτηση, Admin
```

## Εκτέλεση (development)

Προαπαιτούμενα: Node.js 20+, Docker Desktop.

**1. Βάση δεδομένων:**

```bash
docker compose up -d
```

Η MySQL σηκώνεται στην πόρτα **3307** (για να μη συγκρούεται με τυχόν άλλη MySQL) και στην **πρώτη** εκκίνηση τρέχει αυτόματα τα
`db/schema.sql` και `db/seed.sql`. (Για καθαρό ξαναστήσιμο: `docker compose down -v`.)

**2. Backend:**

```bash
cd backend
copy .env.example .env    # Linux/Mac: cp .env.example .env
npm install
npm run dev
```

Το API τρέχει στο `http://localhost:3000` — δοκίμασε:
- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/services`
- **Τεκμηρίωση Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)** (raw OpenAPI JSON στο `/api/docs.json`)

Στο Swagger UI, πάτησε **Authorize** και επικόλλησε το token από το `/api/auth/login` για να δοκιμάσεις τα προστατευμένα endpoints.

**Δημιουργία διαχειριστή** (μία φορά, αφού τρέχει η ΒΔ):

```bash
npm run create-admin -- admin@petgroom.gr ΈναςΔυνατόςΚωδικός1
```

### Endpoints

| Μέθοδος | Endpoint | Πρόσβαση | Περιγραφή |
|---|---|---|---|
| POST | `/api/auth/register` | δημόσιο | Εγγραφή πελάτη (πάντα ρόλος CUSTOMER) |
| POST | `/api/auth/login` | δημόσιο | Σύνδεση — επιστρέφει JWT + στοιχεία χρήστη |
| GET | `/api/auth/me` | με token | Προφίλ συνδεδεμένου χρήστη |
| GET | `/api/services` | δημόσιο | Λίστα ενεργών υπηρεσιών |
| GET | `/api/services/:id` | δημόσιο | Μία υπηρεσία |
| GET | `/api/services/all` | ADMIN | Όλες οι υπηρεσίες, μαζί με ανενεργές |
| POST | `/api/services` | ADMIN | Δημιουργία υπηρεσίας |
| PUT | `/api/services/:id` | ADMIN | Ενημέρωση υπηρεσίας |
| DELETE | `/api/services/:id` | ADMIN | Απενεργοποίηση υπηρεσίας (soft delete) |
| GET | `/api/pets` | με token | Τα κατοικίδιά μου (ADMIN: όλα) |
| POST | `/api/pets` | με token | Καταχώρηση κατοικιδίου (στον συνδεδεμένο χρήστη) |
| GET | `/api/pets/:id` | ιδιοκτήτης/ADMIN | Ένα κατοικίδιο |
| PUT | `/api/pets/:id` | ιδιοκτήτης/ADMIN | Ενημέρωση (δέχεται και μερικά πεδία) |
| DELETE | `/api/pets/:id` | ιδιοκτήτης/ADMIN | Διαγραφή |
| GET | `/api/users/groomers` | με token | Λίστα groomers (id + όνομα) για την κράτηση |
| GET | `/api/users?role=` | ADMIN | Λίστα χρηστών, προαιρετικό φίλτρο ρόλου |
| PUT | `/api/users/:id/role` | ADMIN | Αλλαγή ρόλου χρήστη (π.χ. προαγωγή σε GROOMER) |
| GET | `/api/appointments/availability` | με token | Ελεύθερες ώρες: `?groomerId=&serviceId=&date=YYYY-MM-DD` |
| GET | `/api/appointments` | με token | CUSTOMER: τα δικά του, GROOMER: το πρόγραμμά του, ADMIN: όλα |
| POST | `/api/appointments` | με token | Κράτηση `{petId, serviceId, groomerId, startsAt}` — με έλεγχο επικάλυψης |
| GET | `/api/appointments/:id` | εμπλεκόμενοι/ADMIN | Ένα ραντεβού (πελάτης, groomer ή admin) |
| PATCH | `/api/appointments/:id/status` | εμπλεκόμενοι/ADMIN | Αλλαγή κατάστασης — ο πελάτης μόνο σε CANCELLED |

**Κανόνες ραντεβού:** ωράριο 09:00–17:00, slots ανά 30', κατάσταση `PENDING → CONFIRMED → COMPLETED` (ή `CANCELLED`).
Ο έλεγχος επικάλυψης γίνεται σε **transaction με `SELECT ... FOR UPDATE`**, ώστε δύο ταυτόχρονες
κρατήσεις να μην πάρουν το ίδιο slot.

Στα προστατευμένα endpoints στέλνεις header `Authorization: Bearer <token>`.

**3. Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Άνοιξε το `http://localhost:5173` (αν η πόρτα είναι πιασμένη, το Vite θα διαλέξει άλλη — δες το τερματικό).
Το Vite προωθεί αυτόματα τα `/api/*` requests στο backend (πόρτα 3000), οπότε δεν χρειάζεται ρύθμιση CORS.

**Λογαριασμοί για δοκιμή:** φτιάξε νέο λογαριασμό από τη σελίδα εγγραφής (γίνεται CUSTOMER)
και admin με το `npm run create-admin`. Για groomer, θυμήσου τη ροή της ενότητας
[Ρόλοι χρηστών](#ρόλοι-χρηστών): εγγραφή πρώτα, προαγωγή από τον admin μετά.

## Tests

Τα tests γράφτηκαν με τον **ενσωματωμένο test runner του Node** (`node --test`) — κανένα
επιπλέον framework.

```bash
cd backend
npm run test:unit   # μόνο τα unit tests (δεν χρειάζονται ΒΔ)
npm test            # όλα: unit + integration (θέλει τη ΒΔ να τρέχει)
```

- **Unit tests** (`backend/test/unit/`): η λογική validation του service layer —
  εγγραφή, κατοικίδια, υπηρεσίες, μορφή ημερομηνιών. Τρέχουν χωρίς βάση.
- **Integration tests** (`backend/test/integration/`): σηκώνουν το Express app σε τυχαία
  πόρτα και χτυπούν τα πραγματικά endpoints με `fetch` πάνω στη ΒΔ — πλήρης ροή:
  εγγραφή, ρόλοι, ownership (403), κράτηση, επικάλυψη (409), κύκλος ζωής ραντεβού.
  Ό,τι δεδομένα δημιουργούν, τα καθαρίζουν στο τέλος.
- **Postman** (προαιρετικά, για χειροκίνητες δοκιμές): το OpenAPI JSON από το
  `/api/docs.json` κάνει Import στο Postman ως έτοιμη συλλογή με όλα τα endpoints.

## Deploy (production με Docker)

Όλη η εφαρμογή — βάση, backend, frontend — σηκώνεται με μία εντολή μέσω του
`docker-compose.prod.yml`:

**1. Ρυθμίσεις:** αντίγραψε το `.env.example` σε `.env` στη ρίζα και όρισε **οπωσδήποτε**
ένα δικό σου `JWT_SECRET` (μεγάλο τυχαίο string):

```bash
copy .env.example .env    # Linux/Mac: cp .env.example .env
```

**2. Build & εκκίνηση:**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Αυτό κάνει build δύο images και σηκώνει τρία containers:

| Container | Τι κάνει |
|---|---|
| `mysql` | MySQL 8 — αρχικοποιείται από τα `db/*.sql`, **χωρίς** εκτεθειμένη πόρτα (πρόσβαση μόνο από το docker network) |
| `backend` | Express API (`backend/Dockerfile`) — περιμένει τη MySQL να γίνει healthy πριν ξεκινήσει |
| `frontend` | nginx (`frontend/Dockerfile`, multi-stage: Vite build → στατικά αρχεία) — σερβίρει το React app και προωθεί τα `/api/*` στο backend |

**3. Πρόσβαση:** `http://localhost:8085` (η πόρτα αλλάζει με το `APP_PORT` στο `.env`).

**4. Δημιουργία διαχειριστή** (μία φορά):

```bash
docker compose -f docker-compose.prod.yml exec backend node scripts/create-admin.js admin@petgroom.gr ΈναςΔυνατόςΚωδικός1
```

**5. Δημιουργία groomers:** οι groomers δεν εγγράφονται απευθείας — κάνουν κανονική εγγραφή
από το UI και ο admin τους προάγει σε GROOMER από τη σελίδα **«Χρήστες»**
(βλ. [Ρόλοι χρηστών](#ρόλοι-χρηστών)). Χωρίς groomer δεν μπορούν να κλειστούν ραντεβού.

**Χρήσιμα:**
- Ενημέρωση μετά από αλλαγές κώδικα: ξανά την εντολή του βήματος 2 (κάνει rebuild ό,τι άλλαξε).
- Σταμάτημα: `docker compose -f docker-compose.prod.yml down` — τα δεδομένα μένουν στο volume.
- Πλήρες καθάρισμα (και της ΒΔ): `docker compose -f docker-compose.prod.yml down -v`.
- Logs: `docker compose -f docker-compose.prod.yml logs -f backend`.

## Πορεία υλοποίησης

- [x] Domain model, σχήμα ΒΔ, docker-compose
- [x] Σκελετός backend (layers: routes → controllers → services → repositories)
- [x] Authentication (register/login, JWT) και authorization ανά ρόλο
- [x] CRUD για Pets (με ownership checks) και Services (admin)
- [x] Ραντεβού με έλεγχο διαθεσιμότητας groomer και κύκλο ζωής κατάστασης
- [x] Τεκμηρίωση Swagger (OpenAPI 3 στο `/api/docs`)
- [x] React frontend (login/εγγραφή, κατοικίδια, κράτηση με διαθέσιμες ώρες, ραντεβού ανά ρόλο, admin: υπηρεσίες + χρήστες)
- [x] Tests: unit + integration (node --test, χωρίς νέα dependencies)
- [x] Deploy με Docker (production compose: mysql + backend + nginx frontend)
