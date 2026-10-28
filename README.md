# 🏠 Hyperlocal Job Matching Platform for Skilled Workers

A comprehensive MERN stack platform connecting skilled workers with customers in their local area. Features include smart worker search, real-time messaging, booking management, payment integration, SMS notifications, and a powerful admin panel.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Installation & Setup

**Windows Users:**
```bash
# Run the setup script
setup.bat

# Start both servers
start.bat
```

**Manual Setup:**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start backend (Terminal 1)
cd backend
npm start

# Start frontend (Terminal 2)
cd frontend
npm start
```

### Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000

### Create Admin User (First Time)
```bash
cd backend
node createAdmin.js
```

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (Customer, Worker, Admin)
- Auth persistence across sessions
- Single admin user system

### 👷 Worker Management
- Complete worker profiles with skills, experience, rates
- Profile picture upload (supports iPhone HEIC/HEIF)
- Admin verification system (only verified workers appear in search)
- Worker statistics and earnings tracking

### 🎯 Smart Worker Search
- Search by service type
- Advanced filters (location, price, rating, experience)
- Smart recommendation algorithm
- Real-time availability status
- Interactive map view with Google Maps

### 📅 Booking System
- Easy booking with date/time selection
- Multiple payment methods (Cash, UPI, Online)
- Razorpay payment integration
- Status tracking (pending → accepted → on-the-way → completed)
- Emergency booking feature
- Price estimation

### 💬 Real-time Communication
- In-app messaging between customers and workers
- Unread message indicators
- Message history
- SMS notifications via Twilio

### 🏆 Admin Panel (Full CRUD)
- Platform statistics dashboard
- Worker verification (approve/reject)
- **View all workers in table**
- **Edit worker details**
- **Delete workers with confirmation**
- Revenue and booking analytics
- Top workers leaderboard
- High-demand services tracking

### 📱 Additional Features
- Reviews and ratings system
- In-app notifications
- Loyalty points
- Service history timeline
- Google Maps integration
- Toast notifications (no browser alerts)
- Mobile-responsive design

---

## 🛠️ Technology Stack

### Backend
- **Node.js & Express.js** - Server framework
- **MongoDB & Mongoose** - Database
- **JWT** - Authentication
- **bcrypt** - Password encryption
- **Multer** - File uploads
- **Twilio** - SMS notifications
- **Razorpay** - Payment processing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Google Maps API** - Location services
- **Recharts** - Analytics visualization

---

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── createAdmin.js   # Admin creation script
│   └── server.js        # Express server
│
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context
│       ├── pages/       # Page components
│       ├── utils/       # Helper functions
│       └── App.js       # Main app component
│
├── start.bat            # Windows startup script
├── setup.bat            # Windows setup script
└── README.md
```

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hyperlocal-jobs
JWT_SECRET=your_jwt_secret_key

# Optional - Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Optional - Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Frontend Environment Variables
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000

# Optional - Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key
```

---

## 👥 User Roles

### Customer
- Search and book workers
- Make payments
- Chat with workers
- Submit reviews
- Track booking history

### Worker
- Receive booking requests
- Accept/reject bookings
- Update job status
- Chat with customers
- View earnings and statistics
- Requires admin verification

### Admin
- View platform statistics
- Verify/reject workers
- Manage all workers (view, edit, delete)
- Monitor bookings and revenue
- View analytics and leaderboards

---

## 📱 SMS Notifications

The platform includes SMS notifications via Twilio:
- Worker receives SMS on new booking
- Customer receives SMS on booking status changes

**Demo Mode**: Works without Twilio credentials (logs to console)
**Production**: Add Twilio credentials to `backend/.env`

See `TWILIO_SMS_SETUP.md` for detailed setup instructions.

---

## 🗺️ Google Maps Integration

Interactive location features:
- Location picker with search and autocomplete
- Drag marker to select location
- Current location button
- Worker locations on map

**Demo Mode**: Works without API key (shows error message)
**Production**: Add Google Maps API key to `frontend/.env`

See `GOOGLE_MAPS_SETUP.md` for detailed setup instructions.

---

## 🧪 Testing

### Test User Accounts

**Customer Account:**
- Register at http://localhost:3001/register
- Select "Customer" role

**Worker Account:**
- Register at http://localhost:3001/register
- Select "Worker" role
- Wait for admin verification

**Admin Account:**
- Create using `node createAdmin.js`
- Login at http://localhost:3001/login

### Testing Workflow
1. Create admin account
2. Register as worker
3. Login as admin and verify worker
4. Register as customer
5. Search for workers
6. Book a worker
7. Test messaging
8. Complete booking
9. Submit review

---

## 📚 Documentation

- `PROJECT_SUBMISSION_READY.md` - Complete feature list and submission checklist
- `QUICK_START.md` - Quick start guide
- `ADMIN_SETUP.md` - Admin setup instructions
- `GOOGLE_MAPS_SETUP.md` - Maps integration guide
- `TWILIO_SMS_SETUP.md` - SMS setup guide
- `TESTING_GUIDE.md` - Testing instructions

---

## 🎯 Key Highlights

✅ Complete MERN stack implementation
✅ 11+ advanced features
✅ Professional UI/UX design
✅ Secure authentication & authorization
✅ Real-time messaging and notifications
✅ Payment integration (Razorpay)
✅ SMS notifications (Twilio)
✅ Google Maps integration
✅ Admin panel with full CRUD operations
✅ Smart recommendation algorithm
✅ Mobile-responsive design
✅ Production-ready code

---

## 🚀 Deployment

### Backend
1. Deploy to Heroku, Railway, or similar
2. Set environment variables
3. Update MongoDB connection string

### Frontend
1. Build: `npm run build`
2. Deploy to Netlify, Vercel, or similar
3. Update API URL in environment variables

---

## 📄 License

This project is created for educational purposes.

---

## 🤝 Support

For issues or questions, refer to the documentation files included in the project.

---

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: 2024
