# Developer Guide for Spend Track

This guide provides instructions for setting up a local development environment for the Spend Track application.

## Prerequisites

- Git
- Node Version Manager (nvm) for Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
- Code editor (Visual Studio Code, Cursor IDE, etc.)

## Setting Up Local Repository

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/spend-track.git
   cd spend-track
   ```

2. **Install Node.js using nvm**

   After installing nvm-windows, open a new terminal/command prompt and run:

   ```bash
   nvm install lts
   nvm use lts
   ```

   This will install and activate the latest LTS (Long Term Support) version of Node.js.

3. **Verify installation**

   ```bash
   node --version
   npm --version
   ```

## Setting Up the Backend

1. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

4. **Start the backend server**

   ```bash
   npm run dev
   ```

## Setting Up the Frontend

1. **Install frontend dependencies**

   ```bash
   cd ../ui
   npm install
   ```

2. **Set up environment variables**

   Create a `.env` file in the ui directory:

   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Start the frontend development server**

   ```bash
   npm run dev
   ```

## Development Workflow

1. Backend API server will be available at: http://localhost:3000
2. Frontend development server will be available at: http://localhost:5173
