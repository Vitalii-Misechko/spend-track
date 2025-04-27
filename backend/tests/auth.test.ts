import { expect } from 'chai';
import { request, testUser, resetTestDatabase } from './testHelper';

describe('Authentication API', () => {
  before(async () => {
    // Reset database before tests
    await resetTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('name', testUser.name);
      expect(response.body.data.user).to.have.property('email', testUser.email);
      expect(response.body.data).to.have.property('token');
    });

    it('should not register a user with the same email', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('already');
    });

    it('should validate required fields', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          name: 'Incomplete User',
          // Missing email and password
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('token');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('email', testUser.email);
      expect(response.body.data.user).to.have.property('name', testUser.name);
    });

    it('should not login with invalid password', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });

    it('should not login with non-existent email', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });
}); 