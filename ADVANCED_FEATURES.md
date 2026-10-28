# Advanced Features Documentation

## New Features Added

### 1. Real-time Messaging System
- Chat between customers and workers for each booking
- Message read status tracking
- Real-time message updates (polling every 3 seconds)
- Conversation history

**Usage:**
- Click "💬 Chat" button on any booking
- Send messages in real-time
- Messages are linked to specific bookings

**API Endpoints:**
- `POST /api/messages` - Send a message
- `GET /api/messages/:bookingId` - Get messages for a booking
- `GET /api/messages/conversations` - Get all conversations

### 2. Notification System
- Real-time notifications for bookings, payments, messages
- Unread notification counter
- Mark as read functionality
- Notification dropdown in navbar

**Notification Types:**
- Booking updates
- Payment confirmations
- New messages
- Review submissions
- System notifications

**API Endpoints:**
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### 3. Payment Integration (Razorpay)
- Secure payment processing
- Payment order creation
- Payment verification
- Payment status tracking

**Setup:**
1. Get Razorpay API keys from https://razorpay.com
2. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

**Usage:**
- "Pay Now" button appears on completed bookings
- Razorpay checkout modal opens
- Payment is verified on backend
- Booking status updates automatically

**API Endpoints:**
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment signature

### 4. Image Upload (Cloudinary)
- Profile picture upload
- Secure cloud storage
- Automatic image optimization

**Setup:**
1. Create account at https://cloudinary.com
2. Add to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**Usage:**
- Upload avatar in profile page
- Images stored in Cloudinary
- URLs saved in database

### 5. Enhanced Profile Management
- Update personal information
- Worker profile customization
- Location updates with GPS
- Profile statistics for workers

**Worker Profile Fields:**
- Bio
- Skills (multiple)
- Experience (years)
- Hourly rate
- Availability status

**API Endpoints:**
- `PATCH /api/profile` - Update profile
- `PATCH /api/profile/location` - Update location
- `GET /api/profile/stats/:id?` - Get worker statistics

### 6. Advanced Analytics
- Monthly earnings chart
- Booking status breakdown
- Job completion statistics
- Revenue tracking

**Features:**
- Visual charts using Recharts
- 6-month historical data
- Status-wise booking counts
- Total earnings calculation

### 7. Location-based Features
- GPS location tracking
- Automatic location updates
- Distance-based worker search
- Geospatial indexing

**Usage:**
- Click "Update Location" in profile
- Browser requests location permission
- Location saved with coordinates
- Used for nearby worker search

## Database Models

### New Models Added:

**Message Model:**
```javascript
{
  booking: ObjectId,
  sender: ObjectId,
  receiver: ObjectId,
  message: String,
  isRead: Boolean,
  createdAt: Date
}
```

**Notification Model:**
```javascript
{
  user: ObjectId,
  title: String,
  message: String,
  type: String, // booking, payment, review, message, system
  relatedId: ObjectId,
  isRead: Boolean,
  createdAt: Date
}
```

## Security Features

1. **JWT Authentication** - All routes protected
2. **Password Hashing** - bcrypt with salt rounds
3. **Payment Verification** - Razorpay signature validation
4. **File Upload Validation** - Image type and size checks
5. **CORS Protection** - Configured for frontend origin

## Performance Optimizations

1. **Geospatial Indexing** - Fast location-based queries
2. **Sparse Indexes** - Efficient optional field indexing
3. **Aggregation Pipelines** - Optimized statistics queries
4. **Message Polling** - Efficient real-time updates

## Testing the Features

### Test Messaging:
1. Create a booking as customer
2. Login as worker and accept booking
3. Click "💬 Chat" on booking
4. Send messages back and forth

### Test Payments:
1. Complete a booking
2. Click "Pay Now" as customer
3. Use Razorpay test cards:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Notifications:
1. Perform any action (booking, payment, message)
2. Check notification bell in navbar
3. Click to view notifications
4. Click notification to mark as read

### Test Profile:
1. Go to Profile page
2. Click "Edit Profile"
3. Update information
4. Upload profile picture
5. Update location with GPS

## API Rate Limiting (Recommended)

Add rate limiting for production:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Future Enhancements

1. **WebSocket Integration** - Real-time messaging without polling
2. **Push Notifications** - Browser/mobile push notifications
3. **Email Notifications** - Email alerts for important events
4. **SMS Integration** - OTP verification and booking alerts
5. **Advanced Search** - Filters by rating, price, availability
6. **Booking Calendar** - Visual calendar for worker availability
7. **Multi-language Support** - Internationalization
8. **Admin Dashboard** - Platform management and analytics
9. **Dispute Resolution** - Booking dispute handling
10. **Worker Verification** - ID and skill verification system

## Troubleshooting

### Messages not updating:
- Check if backend is running
- Verify polling interval (3 seconds)
- Check browser console for errors

### Payment failing:
- Verify Razorpay keys in .env
- Check if Razorpay script loaded
- Use test mode keys for testing

### Notifications not showing:
- Check if notifications API is accessible
- Verify JWT token is valid
- Check polling interval (10 seconds)

### Image upload failing:
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure file is an image type

## Production Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use production MongoDB (Atlas)
- [ ] Add Razorpay production keys
- [ ] Configure Cloudinary production
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Configure CORS properly
- [ ] Add environment validation
- [ ] Set up backup strategy
- [ ] Enable MongoDB indexes
- [ ] Add monitoring (PM2, New Relic)
- [ ] Set up CDN for static assets
- [ ] Configure proper error pages
- [ ] Add API documentation (Swagger)
