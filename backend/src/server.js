import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.warn('ΠΡΟΣΟΧΗ: Δεν έχει οριστεί JWT_SECRET στο .env - το authentication δεν θα λειτουργεί.');
}

app.listen(port, () => {
  console.log(`Το PetGroom API τρέχει στο http://localhost:${port}`);
});
