#!/bin/bash

echo "Setting up Hyperlocal Job Matching Platform..."

# Backend setup
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Frontend setup
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete!"
echo ""
echo "To start the application:"
echo "1. Make sure MongoDB is running"
echo "2. Update backend/.env with your API keys"
echo "3. Run 'cd backend && npm run dev' in one terminal"
echo "4. Run 'cd frontend && npm start' in another terminal"
