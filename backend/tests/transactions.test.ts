import { expect } from 'chai';
import { request, getAuthToken, resetTestDatabase, checkSuccessResponse } from './testHelper';

describe.only('Transactions API', () => {
  let token: string;
  let accountId: number;
  let categoryId: number;
  let transactionId: number;

  before(async () => {
    // Reset database and get auth token
    await resetTestDatabase();
    token = await getAuthToken();
    
    // First, get account categories to find a valid category_id
    const categoriesResponse = await request
      .get('/api/account-categories')
      .set('Authorization', `Bearer ${token}`);
    
    console.log('Categories response:', JSON.stringify(categoriesResponse.body));
    
    // Get the first category ID from the response
    const categories = categoriesResponse.body.data;
    // Use the class-level categoryId variable
    categoryId = categories && categories.length > 0 ? categories[0].id : 1; // Default to 1 if no categories
    
    // Create an account for testing with proper structure
    const accountResponse = await request
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Transactions Test Account',
        category_id: categoryId,  // Using proper category_id field
        currencies: ['USD']       // Required currencies array
      });
    
    console.log('Account creation response:', JSON.stringify(accountResponse.body));
    // Get the ID from the response structure
    accountId = accountResponse.body.data.id;
    if (!accountId) {
      throw new Error('Failed to get account ID from response: ' + JSON.stringify(accountResponse.body));
    }
    
    // We'll use an existing category from the system
    // The categoryId is already set from the account categories API call
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        type: 'expense',
        amount: 50,
        currency_code: 'USD',
        account_id: accountId,
        category_id: categoryId,
        description: 'Test transaction',
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(newTransaction);

      const data = checkSuccessResponse(response, 201);
      expect(data).to.have.property('id');
      expect(data).to.have.property('account_id', accountId);
      expect(data).to.have.property('category_id', categoryId);
      expect(data).to.have.property('amount', newTransaction.amount); // Expense = negative amount
      expect(data).to.have.property('description', newTransaction.description);
      
      // Save transaction ID for later tests
      transactionId = data.id;
    });

    it('should update account balance after transaction', async () => {
      // Check if account balance was updated
      const response = await request
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      // Should be initial 0 minus 50 = -50
      expect(data.currencies[0]).to.have.property('balance', -50);
    });

    it('should not create transaction without authorization', async () => {
      const response = await request
        .post('/api/transactions')
        .send({
          type: 'expense',
          amount: 50,
          currency_code: 'USD',
          account_id: accountId,
          transaction_date: new Date().toISOString().split('T')[0]
        });

      expect(response.status).to.equal(401);
    });

    it('should validate required fields', async () => {
      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  describe('GET /api/transactions', () => {
    it('should retrieve all user transactions', async () => {
      const response = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('transactions');
      expect(data.transactions).to.be.an('array');
      expect(data.transactions.length).to.be.at.least(1);
      expect(data.transactions[0]).to.have.property('id');
      expect(data.transactions[0]).to.have.property('account_id');
      expect(data.transactions[0]).to.have.property('amount');
      expect(data.transactions[0]).to.have.property('transaction_date');
      expect(data).to.have.property('pagination');
    });

    it('should filter transactions by account', async () => {
      const response = await request
        .get(`/api/transactions?accountId=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data.transactions).to.be.an('array');
      expect(data.transactions.length).to.be.at.least(1);
      expect(data.transactions[0]).to.have.property('account_id', accountId);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should retrieve a specific transaction', async () => {
      const response = await request
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', transactionId);
      expect(data).to.have.property('account_id', accountId);
      expect(data).to.have.property('amount', 50);
      expect(data).to.have.property('type', 'expense');
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request
        .get('/api/transactions/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update a transaction', async () => {
      const updatedTransaction = {
        description: 'Updated transaction',
        amount: 75,
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const response = await request
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedTransaction);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', transactionId);
      expect(data).to.have.property('description', updatedTransaction.description);
      expect(data).to.have.property('amount', updatedTransaction.amount);
      expect(data).to.have.property('transaction_date', updatedTransaction.transaction_date);
    });

    it('should update account balance after transaction update', async () => {
      // Check if account balance was updated (previous -50 now -75)
      const response = await request
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data.currencies[0]).to.have.property('balance', -75);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      // First create a new transaction to delete
      const newTransaction = {
        type: 'expense',
        amount: 100,
        currency_code: 'USD',
        account_id: accountId,
        category_id: categoryId, 
        transaction_date: new Date().toISOString().split('T')[0],
        description: 'Transaction to delete'
      };

      const createResponse = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(newTransaction);
      
      const transactionToDelete = createResponse.body.data.id;

      // Get balance before deletion
      const beforeResponse = await request
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);
      const balanceBefore = beforeResponse.body.data.currencies[0].balance;

      // Now delete the transaction
      const response = await request
        .delete(`/api/transactions/${transactionToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');
      
      // Verify balance is updated (+100 since we deleted expense of 100)
      const afterResponse = await request
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(afterResponse.body.data.currencies[0].balance).to.equal(balanceBefore + 100);

      // Verify transaction is gone
      const getResponse = await request
        .get(`/api/transactions/${transactionToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).to.equal(404);
    });
  });
}); 