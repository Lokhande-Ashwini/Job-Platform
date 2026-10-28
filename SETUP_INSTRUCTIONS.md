# Setup Instructions

## Quick Start Guide

### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and run MongoDB as a service
3. MongoDB will run on `mongodb://localhost:27017`

**Alternative:** Use MongoDB Atlas (cloud):
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string and update in `backend/.env`

### Step 2: Install Dependencies

Open terminal in project root:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Edit `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hyperlocal-jobs
JWT_SECRET=hyperlocal_jobs_secret_key_2024
JWT_EXPIRE=7d

# Optional: Add these for full functionality
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Step 4: Get Google Maps API Key (Optional but Recommended)

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Update the key in:
   - `backend/.env` (GOOGLE_MAPS_API_KEY)
   - `frontend/src/components/MapComponent.js` (line 11)

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on http://localhost:3000

### Step 6: Test the Application

1. Open http://localhost:3000
2. Register as a customer or worker
3. If customer: Search for workers and create bookings
4. If worker: View and manage booking requests

## Default Test Users

You can create test users with these roles:

**Customer Account:**
- Name: John Doe
- Email: customer@test.com
- Password: password123
- Role: Customer

**Worker Account:**
- Name: Jane Smith
- Email: worker@test.com
- Password: password123
- Role: Worker
- Skills: Electrician, Plumber

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- For Windows: Check MongoDB service in Services app

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: It will prompt to use different port

### API Errors
- Check backend terminal for error logs
- Verify `.env` file exists and has correct values
- Ensure MongoDB is accessible

### Map Not Loading
- Add Google Maps API key
- Check browser console for errors
- Verify API key has Maps JavaScript API enabled

## Features to Test

1. **Authentication**
   - Register new users (customer/worker)
   - Login/logout

2. **Worker Search** (Customer)
   - Search by skill
   - View worker profiles
   - Create bookings

3. **Booking Management**
   - View all bookings
   - Update booking status
   - Add reviews (customers)

4. **Dashboard**
   - View statistics
   - See recent bookings
   - Analytics charts

## Next Steps

- Add real payment integration with Razorpay
- Implement image upload with Cloudinary
- Add real-time notifications
- Deploy to production

## Support

For issues or questions, check:
- Backend logs in terminal
- Browser console (F12)
- MongoDB connection status
