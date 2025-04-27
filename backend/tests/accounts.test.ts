import { expect } from 'chai';
import { request, getAuthToken, resetTestDatabase, checkSuccessResponse } from './testHelper';

describe('Accounts API', () => {
  let token: string;
  let accountId: number;

  before(async () => {
    // Reset database and get auth token
    await resetTestDatabase();
    token = await getAuthToken();
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const newAccount = {
        name: 'Test Account',
        category_id: 1, // Assuming category ID 1 exists
        currencies: ['USD'] // Specify currencies
      };

      const response = await request
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(newAccount);

      const data = checkSuccessResponse(response, 201);
      expect(data).to.have.property('id');
      expect(data).to.have.property('name', newAccount.name);
      expect(data).to.have.property('category_id', newAccount.category_id);
      expect(data).to.have.property('currencies').that.is.an('array');
      expect(data.currencies[0]).to.have.property('currency_code', 'USD');
      expect(data.currencies[0]).to.have.property('balance', 0); // Initial balance should be 0
      
      // Save account ID for later tests
      accountId = data.id;
    });

    it('should not create account without authorization', async () => {
      const response = await request
        .post('/api/accounts')
        .send({ 
          name: 'Unauthorized Account', 
          category_id: 1, 
          currencies: ['USD'] 
        });

      expect(response.status).to.equal(401);
    });

    it('should validate required fields', async () => {
      const response = await request
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing name and other required fields
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  describe('GET /api/accounts', () => {
    it('should retrieve all user accounts', async () => {
      const response = await request
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.be.an('array');
      expect(data.length).to.be.at.least(1);
      expect(data[0]).to.have.property('id');
      expect(data[0]).to.have.property('name');
      expect(data[0]).to.have.property('currencies').that.is.an('array');
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should retrieve a specific account', async () => {
      const response = await request
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', accountId);
      expect(data).to.have.property('name');
      expect(data).to.have.property('currencies').that.is.an('array');
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request
        .get('/api/accounts/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update an account', async () => {
      const updatedAccount = {
        name: 'Updated Account Name'
      };

      const response = await request
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedAccount);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', accountId);
      expect(data).to.have.property('name', updatedAccount.name);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete an account', async () => {
      // First create a new account to delete
      const newAccount = {
        name: 'Account to Delete',
        category_id: 1,
        currencies: ['USD']
      };

      const createResponse = await request
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(newAccount);
      
      const accountToDelete = createResponse.body.data.id;

      // Now delete it
      const response = await request
        .delete(`/api/accounts/${accountToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('deleted');

      // Verify it's gone
      const getResponse = await request
        .get(`/api/accounts/${accountToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).to.equal(404);
    });
  });
}); 