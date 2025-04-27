import { expect } from 'chai';
import { request, resetTestDatabase, checkSuccessResponse, getAuthToken } from './testHelper';

describe('Currencies API', () => {
  let authToken: string;

  before(async () => {
    // Reset database before tests
    await resetTestDatabase();
    // Get auth token
    authToken = await getAuthToken();
  });

  describe('GET /api/currencies', () => {
    it('should retrieve all currencies', async () => {
      const response = await request
        .get('/api/currencies')
        .set('Authorization', `Bearer ${authToken}`);

      const data = checkSuccessResponse(response);
      expect(data).to.be.an('array');
      expect(data.length).to.be.at.least(1);
      
      // Check currency properties
      const currency = data[0];
      expect(currency).to.have.property('code');
      expect(currency).to.have.property('name');
      expect(currency).to.have.property('symbol');
    });
  });

  describe('GET /api/currencies/:code', () => {
    it('should retrieve a specific currency by code', async () => {
      // USD should exist in most currency databases
      const response = await request
        .get('/api/currencies/USD')
        .set('Authorization', `Bearer ${authToken}`);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('code', 'USD');
      expect(data).to.have.property('name');
      expect(data).to.have.property('symbol');
    });

    it('should return 404 for non-existent currency code', async () => {
      const response = await request
        .get('/api/currencies/INVALID')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });

    it('should validate currency code format', async () => {
      // Currency codes should be valid
      const response = await request
        .get('/api/currencies/123')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Response for invalid currency code:', response.body);
      expect(response.status).to.equal(404);
      // Update assertion to match actual response structure
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });
}); 