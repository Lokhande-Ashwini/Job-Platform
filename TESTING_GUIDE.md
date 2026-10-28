# Testing Guide - All Advanced Features

## 🚀 Quick Start

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

The app will open at `http://localhost:3001`

---

## 👤 Create Test Users

### Create Admin User (MongoDB)
You need to manually create an admin user in MongoDB:

```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash "admin123"
  phone: "9999999999",
  role: "admin",
  location: {
    type: "Point",
    coordinates: [77.5946, 12.9716]
  },
  createdAt: new Date()
})
```

Or register normally and update role:
```javascript
db.users.updateOne(
  { email: "youremail@test.com" },
  { $set: { role: "admin" } }
)
```

### Create Test Worker
1. Go to Register page
2. Select "Worker" role
3. Fill in details:
   - Name: Test Worker
   - Email: worker@test.com
   - Password: worker123
   - Phone: 9876543210
4. Select skills: Electrician, Plumber
5. Experience: 5 years
6. Hourly Rate: 500
7. Bio: "Experienced worker"
8. Register

### Create Test Customer
1. Go to Register page
2. Select "Customer" role
3. Fill in details:
   - Name: Test Customer
   - Email: customer@test.com
   - Password: customer123
   - Phone: 9876543211
4. Register

---

## 🧪 Test Each Feature

### 1. Test Admin Dashboard ✓

**Steps:**
1. Login as admin (admin@test.com / admin123)
2. Click "Admin Panel" in navbar
3. You should see:
   - Platform statistics (users, bookings, revenue)
   - Service demand chart
   - Top workers leaderboard
   - Pending worker verifications

**Test Worker Verification:**
1. You'll see pending workers
2. Click "✓ Verify" to approve a worker
3. Click "✗ Reject" to reject a worker
4. Worker's verification status updates

---

### 2. Test Smart Recommendation ✓

**Steps:**
1. Login as customer
2. Click "Find Workers"
3. Allow location access
4. Select a skill (e.g., Electrician)
5. Click "Search Workers"
6. The top worker should show "⭐ Recommended for You" badge
7. Verified workers show green ✓ badge

**What to Check:**
- Top worker has golden recommendation badge
- Workers sorted by recommendation score
- Distance shown for each worker
- Rating displayed with stars

---

### 3. Test Emergency Booking ✓

**Steps:**
1. Login as customer
2. Find a worker and click "Book Now"
3. Fill booking details
4. Check "🚨 Emergency Booking (Priority Service)"
5. Submit booking
6. Emergency charge (₹100) added automatically

**What to Check:**
- Emergency checkbox works
- Special styling for emergency bookings
- Extra charge applied

---

### 4. Test Price Estimation ✓

**Steps:**
1. Create a booking
2. Backend automatically calculates:
   - Min cost = hourly rate × 1 hour
   - Max cost = hourly rate × 3 hours
   - Emergency multiplier = 1.5x if emergency

**What to Check:**
- Estimated cost calculated automatically
- Emergency bookings cost more

---

### 5. Test Worker Analytics ✓

**Steps:**
1. Login as worker
2. Go to Dashboard
3. Complete some bookings first (see workflow test)
4. You should see:
   - Monthly earnings line chart
   - Service popularity pie chart
   - Total earnings and jobs

**What to Check:**
- Charts display correctly
- Data updates after completing jobs
- Only visible to workers

---

### 6. Test Loyalty Points ✓

**Steps:**
1. Login as customer
2. Complete a booking and pay
3. Go to Dashboard
4. Check loyalty points card
5. Points = Total spent ÷ 10

**What to Check:**
- Points shown in dashboard
- "100 points = ₹50 discount" message
- Points increase after payments

---

### 7. Test Service History Timeline ✓

**Steps:**
1. Complete several bookings
2. Go to Bookings page
3. Click "📅 Show Service History Timeline"
4. You should see:
   - Timeline with dates
   - Service details
   - Amount paid
   - Rating (if reviewed)
   - Loyalty points earned

**What to Check:**
- Timeline displays correctly
- Dots and lines visible
- Only completed bookings shown
- Toggle works

---

### 8. Test Job Workflow ✓

**Complete Workflow Test:**

**As Customer:**
1. Login as customer
2. Find a worker
3. Create a booking
4. Wait for worker to accept

**As Worker:**
1. Login as worker
2. Go to Bookings
3. See pending booking
4. Click "✓ Accept"
5. Click "🚗 On The Way"
6. Click "🔧 Start Job"
7. Click "✓ Complete"

**As Customer (continued):**
1. Refresh bookings
2. See "completed" status
3. Click "⭐ Leave Review"
4. Rate 5 stars and write review
5. Submit review
6. Click "💳 Pay Now"
7. Complete payment (demo mode)

**What to Check:**
- Status changes work
- Buttons appear at right time
- Notifications sent
- Review updates worker rating
- Payment updates status
- Loyalty points awarded

---

### 9. Test Notifications ✓

**Steps:**
1. Perform any action (booking, payment, review)
2. Check bell icon in navbar
3. Unread count should increase
4. Click bell to see notifications
5. Click notification to mark as read

**What to Check:**
- Notifications appear
- Unread count accurate
- Mark as read works
- Different notification types

---

### 10. Test Reviews & Ratings ✓

**Steps:**
1. Complete a booking
2. As customer, click "Leave Review"
3. Select rating (1-5 stars)
4. Write comment
5. Submit review
6. Worker's average rating updates

**What to Check:**
- Review modal works
- Rating updates on worker profile
- Stars display correctly
- Review count increases

---

## 🎯 Complete Test Scenario

### Full User Journey:

1. **Register as Customer**
   - Create account
   - Login

2. **Find Worker**
   - Search for electrician
   - See recommended worker
   - Check verified badge
   - View worker rating

3. **Create Booking**
   - Book worker
   - Add emergency flag
   - Set date/time
   - Submit

4. **Worker Accepts**
   - Login as worker
   - Accept booking
   - Update status to "On The Way"
   - Start job
   - Complete job

5. **Customer Reviews**
   - Login as customer
   - Leave 5-star review
   - Pay for service
   - Earn loyalty points

6. **Check Analytics**
   - Worker sees earnings chart
   - Customer sees loyalty points
   - Admin sees platform stats

7. **View History**
   - Check service timeline
   - See all completed bookings

---

## 🐛 Common Issues & Solutions

### Issue: Admin panel not showing
**Solution:** Make sure user role is 'admin' in database

### Issue: Recommendation badge not showing
**Solution:** Make sure workers have location coordinates set

### Issue: Charts not displaying
**Solution:** Complete some bookings first to generate data

### Issue: Notifications not updating
**Solution:** Wait 10 seconds for polling or refresh page

### Issue: Payment failing
**Solution:** Use demo mode (confirm dialog will appear)

### Issue: Timeline empty
**Solution:** Complete bookings first (status must be 'completed')

---

## 📱 Mobile Testing

All features are responsive. Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## ✅ Feature Checklist

Before submitting, verify:

- [ ] Admin dashboard loads
- [ ] Worker verification works
- [ ] Recommendation badge shows
- [ ] Verified badge shows
- [ ] Emergency booking works
- [ ] Worker analytics display
- [ ] Loyalty points calculate
- [ ] Service timeline shows
- [ ] Job workflow complete
- [ ] Notifications work
- [ ] Reviews update ratings
- [ ] Payment works (demo mode)
- [ ] All charts display
- [ ] Mobile responsive

---

## 🎓 For MCA Project Demonstration

### Key Points to Highlight:

1. **Smart Algorithm** - Recommendation system with scoring
2. **Admin Panel** - Platform management and analytics
3. **Real-world Features** - Emergency booking, loyalty points
4. **Data Visualization** - Charts and graphs
5. **Complete Workflow** - End-to-end booking process
6. **Security** - Role-based access, JWT authentication
7. **User Experience** - Timeline, notifications, reviews
8. **Scalability** - MongoDB, REST API, React

### Demo Flow:
1. Show landing page
2. Register as customer
3. Search and book worker (show recommendation)
4. Login as worker and complete workflow
5. Show analytics and charts
6. Login as admin and show platform stats
7. Show service history timeline

---

## 🎉 All Features Working!

Every feature has been implemented and is ready to test. Follow this guide to verify all functionality before your project submission or demonstration.

Good luck with your MCA project! 🚀
