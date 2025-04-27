import { expect } from 'chai';
import { request, getAuthToken, resetTestDatabase, checkSuccessResponse } from './testHelper';

describe('Categories API', () => {
  let token: string;
  let expenseCategoryId: number;
  let incomeCategoryId: number;

  before(async () => {
    // Reset database and get auth token
    await resetTestDatabase();
    token = await getAuthToken();
  });

  describe('POST /api/categories', () => {
    it('should create a new expense category', async () => {
      const newCategory = {
        name: 'Test Expense Category',
        type: 'expense'
      };

      const response = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory);

      const data = checkSuccessResponse(response, 201);
      expect(data).to.have.property('id');
      expect(data).to.have.property('name', newCategory.name);
      expect(data).to.have.property('user_id');
      
      // Save category ID for later tests
      expenseCategoryId = data.id;
    });

    it('should create a new income category', async () => {
      const newCategory = {
        name: 'Test Income Category',
        type: 'income'
      };

      const response = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory);

      const data = checkSuccessResponse(response, 201);
      expect(data).to.have.property('id');
      expect(data).to.have.property('name', newCategory.name);
      expect(data).to.have.property('user_id');
      
      // Save category ID for later tests
      incomeCategoryId = data.id;
    });

    it('should not create category without authorization', async () => {
      const response = await request
        .post('/api/categories')
        .send({
          name: 'Unauthorized Category',
          type: 'expense'
        });

      expect(response.status).to.equal(401);
    });

    it('should validate category type', async () => {
      const response = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Type Category',
          type: 'invalid'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });
  });

  describe('GET /api/categories/expense', () => {
    it('should retrieve all expense categories', async () => {
      const response = await request
        .get('/api/categories/expense')
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.be.an('array');
      expect(data.length).to.be.at.least(1);
      expect(data[0]).to.have.property('id');
      expect(data[0]).to.have.property('name');
    });

    it('should not retrieve categories without authorization', async () => {
      const response = await request
        .get('/api/categories/expense');

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/categories/income', () => {
    it('should retrieve all income categories', async () => {
      const response = await request
        .get('/api/categories/income')
        .set('Authorization', `Bearer ${token}`);

      const data = checkSuccessResponse(response);
      expect(data).to.be.an('array');
      expect(data.length).to.be.at.least(1);
      expect(data[0]).to.have.property('id');
      expect(data[0]).to.have.property('name');
    });
  });

  describe('PUT /api/categories/:type/:id', () => {
    it('should update an expense category', async () => {
      const updatedCategory = {
        name: 'Updated Expense Category'
      };

      const response = await request
        .put(`/api/categories/expense/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedCategory);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', expenseCategoryId);
      expect(data).to.have.property('name', updatedCategory.name);
      expect(data).to.have.property('user_id');
    });

    it('should update an income category', async () => {
      const updatedCategory = {
        name: 'Updated Income Category'
      };

      const response = await request
        .put(`/api/categories/income/${incomeCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedCategory);

      const data = checkSuccessResponse(response);
      expect(data).to.have.property('id', incomeCategoryId);
      expect(data).to.have.property('name', updatedCategory.name);
      expect(data).to.have.property('user_id');
    });

    it('should validate category type in URL', async () => {
      const response = await request
        .put(`/api/categories/invalid/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Type Update'
        });

      expect(response.status).to.equal(400);
    });
  });

  describe('DELETE /api/categories/:type/:id', () => {
    it('should delete a category', async () => {
      // First create a new category to delete
      const newCategory = {
        name: 'Category to Delete',
        type: 'expense'
      };

      const createResponse = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory);
      
      const categoryToDelete = createResponse.body.data.id;

      // Now delete it
      const response = await request
        .delete(`/api/categories/expense/${categoryToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('deleted');

      // Verify it's gone by attempting to use it
      const getResponse = await request
        .get('/api/categories/expense')
        .set('Authorization', `Bearer ${token}`);
      
      const categories = getResponse.body.data;
      const deletedCategory = categories.find((cat: any) => cat.id === categoryToDelete);
      expect(deletedCategory).to.be.undefined;
    });
  });
}); 