import supertest from 'supertest';
import { expect } from 'chai';
import app from '../index';
import db from '../database';

// Create a supertest agent
const request = supertest(app.callback());

// Test user credentials for authentication tests
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123!',
  preferred_currency: 'USD',
  preferred_date_format: 'MM/DD/YYYY',
  preferred_language: 'en'
};

// Function to get auth token
async function getAuthToken() {
  // First try to login
  let response = await request
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password });
  
  // If user doesn't exist, register first
  if (response.status === 401) {
    await request
      .post('/api/auth/register')
      .send(testUser);
    
    response = await request
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
  }
  
  return response.body.data.token;
}

// Reset test database
async function resetTestDatabase() {
  try {
    // Reinitialize database with fresh schema
    await db.initializeDatabase();
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
}

// Helper functions for common assertions
function checkSuccessResponse(response: any, status = 200) {
  expect(response.status).to.equal(status);
  expect(response.body).to.be.an('object');
  expect(response.body).to.have.property('success', true);
  
  // Return data portion of the response
  return response.body.data;
}

export {
  request,
  testUser,
  getAuthToken,
  resetTestDatabase,
  checkSuccessResponse
}; 