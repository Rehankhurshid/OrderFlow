# Setup Guide for Order Flow Management System

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL database (local or cloud)

## Quick Setup Options

### Option 1: Use Free Cloud Services (Recommended for Quick Start)

1. **Database Setup - Neon (Free PostgreSQL)**

   - Go to https://neon.tech
   - Sign up for a free account
   - Create a new project
   - Copy the connection string from the dashboard
   - Paste it in `.env` as `DATABASE_URL`

2. **Email Setup - Brevo (Optional)**

   - Go to https://www.brevo.com/
   - Sign up for a free account
   - Go to Settings > API Keys
   - Create a new API key
   - Paste it in `.env` as `BREVO_API_KEY`

3. **Session Secret**
   - Generate a random string (at least 32 characters)
   - You can use: `openssl rand -base64 32` in terminal
   - Or use any online random string generator

### Option 2: Local PostgreSQL Setup

1. Install PostgreSQL locally
2. Create a database: `createdb orderflow`
3. Update `.env` with: `DATABASE_URL=postgresql://username:password@localhost:5432/orderflow`

## Running the Application

1. Install dependencies:

   ```bash
   npm install
   ```

2. Update `.env` file with your credentials

3. Run database migrations:

   ```bash
   npm run db:push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:5000 in your browser

## First Time Setup

1. The application will create a default admin user on first run
2. Default credentials will be displayed in the console
3. Use these to log in and create other users

## Troubleshooting

- If you get database connection errors, verify your DATABASE_URL is correct
- If email sending fails, the app will continue but log errors (email is optional)
- Make sure port 5000 is not in use by another application
