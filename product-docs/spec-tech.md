# Technical Architecture & Stack

Focus on quick iterations and simplicity.

## General
- **Architecture:** SPA + RESTful API
- **Database:** SQL (SQLite for local development). Repository pattern for data access. No ORM for simplicity and control over SQL queries.
- **Type Checking:** TypeScript for type safety and better developer experience.

## Frontend Framework (Vite/JS/TS)
- **Framework Choice:** React with Vite for fast development and build times.
- **State Management:** Zustand for global state management, as it's lightweight and easy to integrate with React.
- **UI/UX:** Tailwind CSS for utility-first styling, ensuring a responsive design across devices.
- **Routing:** React Router for client-side routing.
- **Form Handling:** React Hook Form for efficient form management and validation.
- **Testing:** Jest and React Testing Library for unit and integration testing. E2E testing with Playwright.
- **Build Tool:** Vite for fast development and build times.
- **Deployment:** Local development with Vite.

## Backend Framework (Node.js)
- **Framework Choice:** Koa for its lightweight and modular approach.
- **Error Handling:** Centralized error handling middleware in Koa.
- **API Design:** RESTful API with Koa Router for defining routes and middleware.
- **Database Interaction:** Direct SQL queries using `sqlite3` library for SQLite. No ORM for simplicity and control over SQL queries.
- **Authentication:** JWT for stateless authentication. Passwords hashed with bcrypt.
- **Testing:** Mocha and Chai for unit and integration testing. Supertest for API testing.
- **Deployment:** Local development with Koa.
- **Environment Variables:** dotenv for managing environment variables.

## Project Structure
- **Frontend Structure:**
  - `ui/`: Contains all UI components, pages, and styles.
    - `ui/components/`: Reusable components (e.g., buttons, modals).
    - `ui/pages/`: Page components (e.g., dashboard, transaction list).
    - `ui/styles/`: Tailwind CSS configuration and custom styles.
    - `ui/hooks/`: Custom React hooks for shared logic.
    - `ui/utils/`: Utility functions for formatting and calculations.
    - `ui/store/`: Zustand store for global state management.
    - `ui/tests/`: Unit and integration tests for UI components.
    - `ui/tests-e2e/`: End-to-end tests for the UI using Playwright.
    - `ui/types/`: TypeScript types and interfaces.
    - `ui/assets/`: Static assets (images, icons).
    - `ui/locales/`: Localization files for i18n support.
    - `ui/services/`: API service functions for making requests to the backend.
    - `ui/index.tsx`: Entry point for the React application.
    - `ui/package.json`: Frontend dependencies and scripts.
    - `ui/.env`: Environment variables for the frontend.
    - `ui/README.md`: Documentation for the frontend.

- **Backend Structure:**
  - `backend/`: Contains all backend logic, routes, and database interactions.
    - `backend/api/`: API routes and controllers.
    - `backend/api/middleware/`: Koa middleware for authentication, error handling, etc.
    - `backend/api/routes/`: Koa routes for handling API requests.
    - `backend/api/controllers/`: Business logic for handling requests and responses.
    - `backend/services/`: Business logic and service layer for handling requests.
    - `backend/models/`: Database models and schema definitions. Implementation of the repository pattern.
    - `backend/database/`: Database initialization and connection logic.
    - `backend/database/schema.sql`: SQL schema for the database.
    - `backend/database/migrations/`: Directory for database migrations (if needed).
    - `backend/database/seeds/`: Directory for seeding initial data (if needed).
    - `backend/utils/`: Utility functions for various tasks (e.g., date formatting, calculations).
    - `backend/tests/`: Unit and integration tests for backend logic.
    - `backend/index.ts`: Entry point for the Koa application.
    - `backend/package.json`: Backend dependencies and scripts.
    - `backend/.env`: Environment variables for the backend.
    - `backend/README.md`: Documentation for the backend.

## Deployment
- **Local Development:** Use npm scripts to run the frontend and backend servers concurrently.
- **Production Build:** Use Vite to build the frontend for production. Serve static files with Koa.
