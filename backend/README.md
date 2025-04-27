# Environment Variables

The application requires the following environment variables to be set in a `.env` file located in the `backend` directory:

- **PORT**: The port on which the backend server will run. Default: `3001`.
- **DB_PATH**: (Optional) The path to the database. Ensure this is set if the application requires database connectivity.
- **JWT_SECRET**: (Required) The secret key used for signing JSON Web Tokens (JWT). This must be set for authentication to work. Default: `your_jwt_secret`.
- **JWT_EXPIRES_IN**: (Optional) The expiration time for JWT tokens. Default: `7d` (1 day).
- **NODE_ENV**: (Optional) The environment in which the application is running. Default: `development`.

# Backend E2E Tests

This directory contains end-to-end tests for the SpendTrack backend API.

## Test Structure

- `setup.ts` - Environment setup for testing
- `testHelper.ts` - Utility functions for tests
- `database.test.ts` - Tests for database connectivity
- `auth.test.ts` - Tests for authentication endpoints
- `accounts.test.ts` - Tests for account management endpoints
- `transactions.test.ts` - Tests for transaction endpoints

## Running Tests

You can run the tests using several npm scripts:

### Run all tests:

```bash
npm test
```

## Testing Notes

- Tests use an in-memory SQLite database to avoid affecting the development database
- Tests use .env.test to avoid conflicts with a development server