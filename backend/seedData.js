require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Clear everything
    console.log('🗑️  Clearing all data...');
    const Quote = require('./models/Quote');
    const Dispute = require('./models/Dispute');
    const SupportTicket = require('./models/SupportTicket');
    await Promise.all([
      User.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({}),
      Quote.deleteMany({}),
      Dispute.deleteMany({}),
      SupportTicket.deleteMany({}),
    ]);    console.log('✅ All data cleared\n');

    const hash = async (pw) => bcrypt.hash(pw, 10);

    // ── ADMIN ──────────────────────────────────────────
    console.log('👤 Creating admin...');
    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: await hash('admin123'),
      phone: '9999999999',
      role: 'admin',
      location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Pune, Maharashtra' }
    });

    // ── CUSTOMERS ──────────────────────────────────────
    console.log('👥 Creating customers...');
    const customers = await User.insertMany([
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: await hash('password123'),
        phone: '9876543210',
        role: 'customer',
        location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Kothrud, Pune' },
        loyaltyPoints: 120,
        totalSpent: 3500
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: await hash('password123'),
        phone: '9876543211',
        role: 'customer',
        location: { type: 'Point', coordinates: [73.9300, 18.5600], address: 'Viman Nagar, Pune' },
        loyaltyPoints: 80,
        totalSpent: 2200
      },
      {
        name: 'Amit Desai',
        email: 'amit@example.com',
        password: await hash('password123'),
        phone: '9876543212',
        role: 'customer',
        location: { type: 'Point', coordinates: [73.8777, 18.4900], address: 'Hadapsar, Pune' },
        loyaltyPoints: 200,
        totalSpent: 6800
      },
      {
        name: 'Sneha Kulkarni',
        email: 'sneha@example.com',
        password: await hash('password123'),
        phone: '9876543213',
        role: 'customer',
        location: { type: 'Point', coordinates: [73.8200, 18.5500], address: 'Baner, Pune' },
        loyaltyPoints: 50,
        totalSpent: 1500
      },
    ]);

    // ── WORKERS ────────────────────────────────────────
    console.log('👷 Creating workers...');
    const workers = await User.insertMany([
      {
        name: 'Suresh Electrician',
        email: 'suresh.electric@example.com',
        password: await hash('password123'),
        phone: '9812345601',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8600, 18.5250], address: 'Shivajinagar, Pune' },
        workerProfile: {
          skills: ['Electrician'],
          experience: 8,
          hourlyRate: 350,
          bio: 'Certified electrician with 8 years of experience in residential and commercial wiring.',
          availability: true,
          rating: 4.8,
          totalJobs: 142,
          totalReviews: 98,
          completionRate: 96,
          verificationStatus: 'verified',
          isOnline: true
        }
      },
      {
        name: 'Manoj Plumber',
        email: 'manoj.plumber@example.com',
        password: await hash('password123'),
        phone: '9812345602',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8700, 18.5100], address: 'Deccan, Pune' },
        workerProfile: {
          skills: ['Plumber'],
          experience: 6,
          hourlyRate: 300,
          bio: 'Expert plumber handling leaks, installations, and bathroom fittings.',
          availability: true,
          rating: 4.6,
          totalJobs: 98,
          totalReviews: 72,
          completionRate: 94,
          verificationStatus: 'verified',
          isOnline: true
        }
      },
      {
        name: 'Ravi Carpenter',
        email: 'ravi.carpenter@example.com',
        password: await hash('password123'),
        phone: '9812345603',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.9100, 18.5300], address: 'Kalyani Nagar, Pune' },
        workerProfile: {
          skills: ['Carpenter'],
          experience: 10,
          hourlyRate: 450,
          bio: 'Skilled carpenter specializing in custom furniture and modular kitchens.',
          availability: true,
          rating: 4.9,
          totalJobs: 187,
          totalReviews: 145,
          completionRate: 98,
          verificationStatus: 'verified',
          isOnline: false
        }
      },
      {
        name: 'Deepak Mechanic',
        email: 'deepak.mechanic@example.com',
        password: await hash('password123'),
        phone: '9812345604',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8400, 18.5000], address: 'Swargate, Pune' },
        workerProfile: {
          skills: ['Mechanic'],
          experience: 12,
          hourlyRate: 500,
          bio: 'Certified auto mechanic for cars and bikes. Doorstep service available.',
          availability: true,
          rating: 4.7,
          totalJobs: 210,
          totalReviews: 160,
          completionRate: 95,
          verificationStatus: 'verified',
          isOnline: true
        }
      },
      {
        name: 'Anita Tutor',
        email: 'anita.tutor@example.com',
        password: await hash('password123'),
        phone: '9812345605',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.9200, 18.5600], address: 'Koregaon Park, Pune' },
        workerProfile: {
          skills: ['Tutor'],
          experience: 5,
          hourlyRate: 400,
          bio: 'M.Sc. Mathematics. Expert in JEE/NEET coaching and school subjects.',
          availability: true,
          rating: 4.9,
          totalJobs: 76,
          totalReviews: 65,
          completionRate: 99,
          verificationStatus: 'verified',
          isOnline: true
        }
      },
      {
        name: 'Vijay Painter',
        email: 'vijay.painter@example.com',
        password: await hash('password123'),
        phone: '9812345606',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8500, 18.5400], address: 'Aundh, Pune' },
        workerProfile: {
          skills: ['Painter'],
          experience: 7,
          hourlyRate: 250,
          bio: 'Professional painter for interior, exterior, and texture painting.',
          availability: true,
          rating: 4.5,
          totalJobs: 115,
          totalReviews: 88,
          completionRate: 93,
          verificationStatus: 'verified',
          isOnline: false
        }
      },
      {
        name: 'Kavita Cleaner',
        email: 'kavita.cleaner@example.com',
        password: await hash('password123'),
        phone: '9812345607',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8650, 18.5350], address: 'Wakad, Pune' },
        workerProfile: {
          skills: ['Cleaner'],
          experience: 4,
          hourlyRate: 200,
          bio: 'Professional home and office cleaning with eco-friendly products.',
          availability: true,
          rating: 4.7,
          totalJobs: 89,
          totalReviews: 70,
          completionRate: 97,
          verificationStatus: 'verified',
          isOnline: true
        }
      },
      {
        name: 'Ganesh Gardener',
        email: 'ganesh.gardener@example.com',
        password: await hash('password123'),
        phone: '9812345608',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8800, 18.5150], address: 'Bibwewadi, Pune' },
        workerProfile: {
          skills: ['Gardener'],
          experience: 9,
          hourlyRate: 300,
          bio: 'Expert gardener for lawn care, landscaping, and terrace gardens.',
          availability: true,
          rating: 4.8,
          totalJobs: 134,
          totalReviews: 102,
          completionRate: 96,
          verificationStatus: 'verified',
          isOnline: false
        }
      },
      // Pending worker
      {
        name: 'Nikhil AC Tech',
        email: 'nikhil.ac@example.com',
        password: await hash('password123'),
        phone: '9812345609',
        role: 'worker',
        location: { type: 'Point', coordinates: [73.8750, 18.5450], address: 'Pimple Saudagar, Pune' },
        workerProfile: {
          skills: ['AC Technician', 'Electrician'],
          experience: 3,
          hourlyRate: 400,
          bio: 'AC installation, servicing, and gas refilling specialist.',
          availability: true,
          rating: 0,
          totalJobs: 0,
          totalReviews: 0,
          completionRate: 0,
          verificationStatus: 'pending',
          isOnline: false
        }
      },
    ]);

    // ── BOOKINGS ───────────────────────────────────────
    console.log('📋 Creating bookings...');
    const bookings = await Booking.insertMany([
      {
        customer: customers[0]._id,
        worker: workers[0]._id,
        service: 'Electrician',
        description: 'Fan installation and switchboard repair',
        location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Kothrud, Pune' },
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        amount: 700,
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        review: { rating: 5, comment: 'Excellent work! Very professional.', createdAt: new Date() },
        loyaltyPointsEarned: 70,
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[1]._id,
        worker: workers[1]._id,
        service: 'Plumber',
        description: 'Kitchen pipe leak repair',
        location: { type: 'Point', coordinates: [73.9300, 18.5600], address: 'Viman Nagar, Pune' },
        scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'completed',
        amount: 600,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        review: { rating: 4, comment: 'Good service, fixed the leak quickly.', createdAt: new Date() },
        loyaltyPointsEarned: 60,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[2]._id,
        worker: workers[2]._id,
        service: 'Carpenter',
        description: 'Wardrobe installation in bedroom',
        location: { type: 'Point', coordinates: [73.8777, 18.4900], address: 'Hadapsar, Pune' },
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed',
        amount: 2200,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        review: { rating: 5, comment: 'Amazing craftsmanship! Highly recommended.', createdAt: new Date() },
        loyaltyPointsEarned: 220,
        completedAt: new Date()
      },
      {
        customer: customers[0]._id,
        worker: workers[3]._id,
        service: 'Mechanic',
        description: 'Car servicing and oil change',
        location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Kothrud, Pune' },
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        amount: 1500,
        paymentMethod: 'upi',
        paymentStatus: 'pending',
        loyaltyPointsEarned: 0
      },
      {
        customer: customers[3]._id,
        worker: workers[4]._id,
        service: 'Tutor',
        description: 'Mathematics tutoring for Class 10',
        location: { type: 'Point', coordinates: [73.8200, 18.5500], address: 'Baner, Pune' },
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        amount: 800,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        loyaltyPointsEarned: 0
      },
      {
        customer: customers[1]._id,
        worker: workers[5]._id,
        service: 'Painter',
        description: 'Living room interior painting',
        location: { type: 'Point', coordinates: [73.9300, 18.5600], address: 'Viman Nagar, Pune' },
        scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'completed',
        amount: 4500,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        review: { rating: 5, comment: 'Beautiful finish! Very neat work.', createdAt: new Date() },
        loyaltyPointsEarned: 450,
        completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      },
    ]);

    // ── NOTIFICATIONS ──────────────────────────────────
    console.log('🔔 Creating notifications...');
    await Notification.insertMany([
      { user: customers[0]._id, title: 'Booking Confirmed', message: 'Your electrician booking has been confirmed.', type: 'booking', isRead: true },
      { user: customers[0]._id, title: 'Job Completed', message: 'Your fan installation job is completed. Please rate the worker.', type: 'booking', isRead: false },
      { user: customers[1]._id, title: 'Payment Received', message: 'Payment of ₹600 received for plumbing service.', type: 'payment', isRead: true },
      { user: workers[0]._id, title: 'New Booking', message: 'You have a new booking from Rahul Sharma.', type: 'booking', isRead: false },
      { user: workers[0]._id, title: 'Payment Received', message: 'You received ₹700 for the electrician job.', type: 'payment', isRead: true },
      { user: customers[2]._id, title: 'Worker On The Way', message: 'Your carpenter Ravi is on the way to your location.', type: 'booking', isRead: false },
    ]);

    // ── MESSAGES ───────────────────────────────────────
    console.log('💬 Creating messages...');
    await Message.insertMany([
      { booking: bookings[0]._id, sender: customers[0]._id, receiver: workers[0]._id, message: 'Hi, when can you come for the fan installation?', isRead: true },
      { booking: bookings[0]._id, sender: workers[0]._id, receiver: customers[0]._id, message: 'I can come tomorrow at 10 AM. Is that okay?', isRead: true },
      { booking: bookings[0]._id, sender: customers[0]._id, receiver: workers[0]._id, message: 'Perfect! See you then.', isRead: true },
      { booking: bookings[3]._id, sender: customers[0]._id, receiver: workers[3]._id, message: 'Please bring engine oil for the service.', isRead: false },
      { booking: bookings[4]._id, sender: customers[3]._id, receiver: workers[4]._id, message: 'My daughter needs help with algebra and geometry.', isRead: true },
      { booking: bookings[4]._id, sender: workers[4]._id, receiver: customers[3]._id, message: 'Sure! I specialize in both. See you on Wednesday.', isRead: false },
    ]);

    // ── QUOTES ─────────────────────────────────────────
    console.log('🏷️ Creating quotes...');
    await Quote.insertMany([
      {
        booking: bookings[3]._id,
        customer: customers[0]._id,
        worker: workers[3]._id,
        baseRate: 500,
        estimatedAmount: 1500,
        quotedAmount: 1800,
        reason: 'Engine oil and filter replacement included in the price.',
        status: 'new',
        seenBy: [],
        history: [{ action: 'submitted', by: workers[3]._id, amount: 1800, note: 'Includes parts' }]
      },
    ]);

    // ── DISPUTES ───────────────────────────────────────
    console.log('⚠️ Creating disputes...');
    await Dispute.insertMany([
      {
        booking: bookings[1]._id,
        raisedBy: customers[1]._id,
        against: workers[1]._id,
        reason: 'Work not completed properly',
        description: 'The plumber fixed the visible leak but there is still water seeping from behind the wall. The issue was not fully resolved.',
        status: 'under-review',
        seenBy: [customers[1]._id],
        activity: [
          { action: 'Dispute raised', by: customers[1]._id, byRole: 'customer', note: 'Work not completed properly' },
          { action: 'Status changed: open to under-review', byRole: 'admin', note: 'Admin reviewing the case' }
        ]
      },
    ]);

    // ── SUPPORT TICKETS ────────────────────────────────
    console.log('🎫 Creating support tickets...');
    await SupportTicket.insertMany([
      {
        raisedBy: customers[2]._id,
        raisedByRole: 'customer',
        customer: customers[2]._id,
        subject: 'Payment not reflecting in my account',
        category: 'payment-issue',
        description: 'I paid Rs 2200 for the carpenter booking via online transfer but the payment status still shows pending.',
        priority: 'high',
        status: 'in-progress',
        messages: [
          { sender: customers[2]._id, senderRole: 'customer', text: 'I paid Rs 2200 for the carpenter booking but payment status shows pending.', isRead: true },
          { sender: customers[2]._id, senderRole: 'admin', text: 'We are looking into this. Can you share the transaction ID?', isRead: false },
        ],
        firstResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('═══════════════════════════════════════════════');
    console.log('  ADMIN');
    console.log('  Email    : admin@test.com');
    console.log('  Password : admin123');
    console.log('───────────────────────────────────────────────');
    console.log('  CUSTOMERS (password: password123)');
    console.log('  rahul@example.com');
    console.log('  priya@example.com');
    console.log('  amit@example.com');
    console.log('  sneha@example.com');
    console.log('───────────────────────────────────────────────');
    console.log('  WORKERS (password: password123)');
    console.log('  suresh.electric@example.com  — Electrician');
    console.log('  manoj.plumber@example.com    — Plumber');
    console.log('  ravi.carpenter@example.com   — Carpenter');
    console.log('  deepak.mechanic@example.com  — Mechanic');
    console.log('  anita.tutor@example.com      — Tutor');
    console.log('  vijay.painter@example.com    — Painter');
    console.log('  kavita.cleaner@example.com   — Cleaner');
    console.log('  ganesh.gardener@example.com  — Gardener');
    console.log('  nikhil.ac@example.com        — Pending approval');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();
