import { expect } from 'chai';
import { request, getAuthToken, resetTestDatabase, checkSuccessResponse, testUser } from './testHelper';

describe('Users API', () => {
  let token: string;

  before(async () => {
    // Reset database and get auth token
    await resetTestDatabase();
    token = await getAuthToken();
  });

  describe('GET /api/users/profile', () => {
    it('should retrieve the user profile', async () => {
      const response = await request
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id');
      expect(data).to.have.property('email', testUser.email);
      expect(data).to.have.property('name', testUser.name);
      expect(data).to.have.property('preferred_currency', testUser.preferred_currency);
      expect(data).to.have.property('preferred_date_format', testUser.preferred_date_format);
      expect(data).to.have.property('preferred_language', testUser.preferred_language);
      // Password should not be returned
      expect(data).not.to.have.property('password');
    });

    it('should not retrieve profile without authorization', async () => {
      const response = await request
        .get('/api/users/profile');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update the user profile', async () => {
      const updatedProfile = {
        name: 'Updated User Name',
        preferred_language: 'es'
      };

      const response = await request
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedProfile);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id');
      expect(data).to.have.property('name', updatedProfile.name);
      expect(data).to.have.property('preferred_language', updatedProfile.preferred_language);
    });

    it('should not update profile without authorization', async () => {
      const response = await request
        .put('/api/users/profile')
        .send({ name: 'Unauthorized Update' });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });

    it('should validate email format if provided', async () => {
      const response = await request
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'invalid-email'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  // Don't actually delete the user since it will affect other tests
  describe('DELETE /api/users/profile', () => {
    it('should require authorization for deleting profile', async () => {
      const response = await request
        .delete('/api/users/profile');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });
}); 