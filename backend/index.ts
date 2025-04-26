import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import database
import db from './database';

// Import routes
import authRoutes from './api/routes/auth';
import userRoutes from './api/routes/users';
import accountRoutes from './api/routes/accounts';
import categoryRoutes from './api/routes/categories';
import transactionRoutes from './api/routes/transactions';
import currencyRoutes from './api/routes/currencies';

// Import middleware
import errorMiddleware from './api/middleware/error';
import authMiddleware from './api/middleware/auth';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Initialize the app
const app = new Koa();
const router = new Router();

// Set up middleware
app.use(logger());
app.use(cors()); // using cors() without any configuration allows requests from all origins, which might not be secure for some applications.
app.use(bodyParser());
app.use(errorMiddleware);

// Set up routes
router.use('/api/auth', authRoutes.routes(), authRoutes.allowedMethods());
router.use('/api/users', authMiddleware, userRoutes.routes(), userRoutes.allowedMethods());
router.use('/api/accounts', authMiddleware, accountRoutes.routes(), accountRoutes.allowedMethods());
router.use('/api/categories', authMiddleware, categoryRoutes.routes(), categoryRoutes.allowedMethods());
router.use('/api/transactions', authMiddleware, transactionRoutes.routes(), transactionRoutes.allowedMethods());
router.use('/api/currencies', authMiddleware, currencyRoutes.routes(), currencyRoutes.allowedMethods());

// Add routes to app
app.use(router.routes());
app.use(router.allowedMethods());

// Set port
const PORT = process.env.PORT || 3001;

// Start server function
const startServer = async () => {
  try {
    // Initialize database
    await db.initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await db.close();
    console.log('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

export default app; 