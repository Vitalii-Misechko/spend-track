import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log('Setting up test environment');

// Load test environment variables
const envPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded test environment variables from .env.test');
} else {
  dotenv.config();
  console.log('Loaded default environment variables');
}
