#!/bin/bash

echo "========================================"
echo "Order Flow Management System - Local Setup"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "Please create a .env file manually"
fi

echo "This application requires a PostgreSQL database."
echo ""
echo "You have two options:"
echo ""
echo "1. Quick Setup with Neon (Recommended - Free cloud PostgreSQL)"
echo "   - Go to https://neon.tech"
echo "   - Sign up for a free account"
echo "   - Create a new project"
echo "   - Copy the connection string"
echo "   - Paste it in .env as DATABASE_URL"
echo ""
echo "2. Local PostgreSQL"
echo "   - Install PostgreSQL locally"
echo "   - Create a database: createdb orderflow"
echo "   - Update .env with: DATABASE_URL=postgresql://username:password@localhost:5432/orderflow"
echo ""
echo "After setting up the database:"
echo "1. Update the DATABASE_URL in .env file"
echo "2. Run: npm run db:push"
echo "3. Run: npm run dev"
echo "4. Open http://localhost:5000"
echo ""
echo "Optional: For email functionality, sign up at https://www.brevo.com/ and add BREVO_API_KEY to .env"
echo ""
