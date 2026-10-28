# System Architecture

## Tech Stack
- **Frontend:** React, Recharts, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Auth:** JWT, bcrypt
- **APIs:** Razorpay, Cloudinary

## System Flow
```
User → React App → Express API → MongoDB
                ↓
         JWT Auth Middleware
                ↓
         Controllers → Models
```

## Key Features
1. Smart Recommendation Algorithm
2. Worker Verification System
3. Emergency Booking
4. Price Estimation
5. Review & Rating
6. Earnings Analytics
7. Loyalty Points
8. Notifications
9. Service History
10. Admin Panel
11. Job Workflow

## Database Collections
- users (customers, workers, admin)
- bookings (with reviews, payments)
- messages (chat)
- notifications (real-time)
- reviews (ratings)

## API Routes
- /api/auth - Authentication
- /api/workers - Worker search
- /api/bookings - Booking management
- /api/admin - Admin panel
- /api/profile - User profile
- /api/messages - Chat
- /api/notifications - Notifications
- /api/payments - Payment processing

## Security
- JWT token authentication
- Role-based access control
- Password hashing (bcrypt)
- Protected routes
- Admin-only endpoints

## Status: ✅ Complete
