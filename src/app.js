import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './modules/auth/auth.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import { success } from './utils/apiResponse.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => success(res, { status: 'ok' }, 'IKNOS IS RUNNING!!!'));

// Routes
app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;