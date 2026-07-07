import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import authRoutes from './routes/auth.routes.js';
import serviceRoutes from './routes/service.routes.js';
import petRoutes from './routes/pet.routes.js';
import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import { authenticate } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pets', authenticate, petRoutes); // όλα τα endpoints των pets θέλουν σύνδεση
app.use('/api/users', userRoutes);
app.use('/api/appointments', authenticate, appointmentRoutes);

// Τεκμηρίωση API: Swagger UI στο /api/docs, raw JSON στο /api/docs.json
app.get('/api/docs.json', (req, res) => res.json(openApiDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(notFound);
app.use(errorHandler);

export default app;
