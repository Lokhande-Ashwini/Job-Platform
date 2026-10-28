@echo off
echo Setting up Hyperlocal Job Matching Platform...
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Make sure MongoDB is running
echo 2. Update backend\.env with your API keys
echo 3. Open terminal 1: cd backend ^&^& npm run dev
echo 4. Open terminal 2: cd frontend ^&^& npm start
echo.
pause
