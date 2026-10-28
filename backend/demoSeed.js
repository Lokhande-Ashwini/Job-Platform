require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Message = require('./models/Message');
const Quote = require('./models/Quote');
const Dispute = require('./models/Dispute');
const SupportTicket = require('./models/SupportTicket');
const AdminMessage = require('./models/AdminMessage');
const PaymentTransaction = require('./models/PaymentTransaction');
const WorkerPayout = require('./models/WorkerPayout');

const hash = (pw) => bcrypt.hash(pw, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs');
    console.log('Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}), Booking.deleteMany({}), Notification.deleteMany({}),
      Message.deleteMany({}), Quote.deleteMany({}), Dispute.deleteMany({}),
      SupportTicket.deleteMany({}), AdminMessage.deleteMany({}),
      PaymentTransaction.deleteMany({}), WorkerPayout.deleteMany({}),
    ]);
    console.log('Cleared all data');

    // ── ADMIN ──────────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User', email: 'admin@test.com',
      password: await hash('admin123'), phone: '9999999999', role: 'admin',
      location: { type:'Point', coordinates:[73.8567,18.5204], address:'Pune, Maharashtra' }
    });

    // ── CUSTOMERS ──────────────────────────────────────────────────────────
    const customers = await User.insertMany([
      { name:'Rahul Sharma', email:'rahul@example.com', password:await hash('password123'), phone:'9876543210', role:'customer',
        location:{type:'Point',coordinates:[73.8567,18.5204],address:'Kothrud, Pune'}, loyaltyPoints:120, totalSpent:8500 },
      { name:'Priya Patel', email:'priya@example.com', password:await hash('password123'), phone:'9876543211', role:'customer',
        location:{type:'Point',coordinates:[73.9300,18.5600],address:'Viman Nagar, Pune'}, loyaltyPoints:80, totalSpent:4200 },
      { name:'Amit Desai', email:'amit@example.com', password:await hash('password123'), phone:'9876543212', role:'customer',
        location:{type:'Point',coordinates:[73.8777,18.4900],address:'Hadapsar, Pune'}, loyaltyPoints:200, totalSpent:12800 },
      { name:'Sneha Kulkarni', email:'sneha@example.com', password:await hash('password123'), phone:'9876543213', role:'customer',
        location:{type:'Point',coordinates:[73.8200,18.5500],address:'Baner, Pune'}, loyaltyPoints:50, totalSpent:2500 },
    ]);

    // ── WORKERS ────────────────────────────────────────────────────────────
    const workers = await User.insertMany([
      { name:'Suresh Electrician', email:'suresh.electric@example.com', password:await hash('password123'), phone:'9812345601', role:'worker',
        location:{type:'Point',coordinates:[73.8600,18.5250],address:'Shivajinagar, Pune'},
        workerProfile:{ skills:['Electrician'], experience:8, hourlyRate:350, bio:'Certified electrician with 8 years experience.', availability:true, rating:4.8, totalJobs:142, totalReviews:98, completionRate:96, verificationStatus:'verified', isOnline:true }},
      { name:'Manoj Plumber', email:'manoj.plumber@example.com', password:await hash('password123'), phone:'9812345602', role:'worker',
        location:{type:'Point',coordinates:[73.8700,18.5100],address:'Deccan, Pune'},
        workerProfile:{ skills:['Plumber'], experience:6, hourlyRate:300, bio:'Expert plumber for leaks and installations.', availability:true, rating:4.6, totalJobs:98, totalReviews:72, completionRate:94, verificationStatus:'verified', isOnline:true }},
      { name:'Ravi Carpenter', email:'ravi.carpenter@example.com', password:await hash('password123'), phone:'9812345603', role:'worker',
        location:{type:'Point',coordinates:[73.9100,18.5300],address:'Kalyani Nagar, Pune'},
        workerProfile:{ skills:['Carpenter'], experience:10, hourlyRate:450, bio:'Custom furniture and modular kitchens specialist.', availability:true, rating:4.9, totalJobs:187, totalReviews:145, completionRate:98, verificationStatus:'verified', isOnline:false }},
      { name:'Deepak Mechanic', email:'deepak.mechanic@example.com', password:await hash('password123'), phone:'9812345604', role:'worker',
        location:{type:'Point',coordinates:[73.8400,18.5000],address:'Swargate, Pune'},
        workerProfile:{ skills:['Mechanic'], experience:12, hourlyRate:500, bio:'Certified auto mechanic. Doorstep service.', availability:true, rating:4.7, totalJobs:210, totalReviews:160, completionRate:95, verificationStatus:'verified', isOnline:true }},
      { name:'Anita Tutor', email:'anita.tutor@example.com', password:await hash('password123'), phone:'9812345605', role:'worker',
        location:{type:'Point',coordinates:[73.9200,18.5600],address:'Koregaon Park, Pune'},
        workerProfile:{ skills:['Tutor'], experience:5, hourlyRate:400, bio:'M.Sc. Mathematics. JEE/NEET coaching expert.', availability:true, rating:4.9, totalJobs:76, totalReviews:65, completionRate:99, verificationStatus:'verified', isOnline:true }},
      { name:'Vijay Painter', email:'vijay.painter@example.com', password:await hash('password123'), phone:'9812345606', role:'worker',
        location:{type:'Point',coordinates:[73.8500,18.5400],address:'Aundh, Pune'},
        workerProfile:{ skills:['Painter'], experience:7, hourlyRate:250, bio:'Interior, exterior and texture painting.', availability:true, rating:4.5, totalJobs:115, totalReviews:88, completionRate:93, verificationStatus:'verified', isOnline:false }},
      { name:'Kavita Cleaner', email:'kavita.cleaner@example.com', password:await hash('password123'), phone:'9812345607', role:'worker',
        location:{type:'Point',coordinates:[73.8650,18.5350],address:'Wakad, Pune'},
        workerProfile:{ skills:['Cleaner'], experience:4, hourlyRate:200, bio:'Professional home and office cleaning.', availability:true, rating:4.7, totalJobs:89, totalReviews:70, completionRate:97, verificationStatus:'verified', isOnline:true }},
      { name:'Nikhil AC Tech', email:'nikhil.ac@example.com', password:await hash('password123'), phone:'9812345609', role:'worker',
        location:{type:'Point',coordinates:[73.8750,18.5450],address:'Pimple Saudagar, Pune'},
        workerProfile:{ skills:['AC Technician'], experience:3, hourlyRate:400, bio:'AC installation and servicing.', availability:true, rating:0, totalJobs:0, totalReviews:0, completionRate:0, verificationStatus:'submitted', isOnline:false }},
    ]);

    console.log('Created users');

    // ── BOOKINGS ───────────────────────────────────────────────────────────
    const bookings = await Booking.insertMany([
      // Completed bookings
      { customer:customers[0]._id, worker:workers[0]._id, service:'Electrician', description:'Fan installation and switchboard repair',
        location:{type:'Point',coordinates:[73.8567,18.5204],address:'Kothrud, Pune'}, scheduledDate:daysAgo(7),
        status:'completed', amount:700, paymentMethod:'upi', paymentStatus:'paid',
        review:{rating:5,comment:'Excellent work! Very professional.',createdAt:daysAgo(6)},
        loyaltyPointsEarned:70, completedAt:daysAgo(6), paidAt:daysAgo(6),
        timeline:[{status:'requested',note:'Booking created',byRole:'customer',by:customers[0]._id,at:daysAgo(8)},{status:'accepted',note:'Worker accepted',byRole:'worker',by:workers[0]._id,at:daysAgo(7)},{status:'completed',note:'Job done',byRole:'worker',by:workers[0]._id,at:daysAgo(6)}]},
      { customer:customers[1]._id, worker:workers[1]._id, service:'Plumber', description:'Kitchen pipe leak repair',
        location:{type:'Point',coordinates:[73.9300,18.5600],address:'Viman Nagar, Pune'}, scheduledDate:daysAgo(3),
        status:'completed', amount:600, paymentMethod:'cash', paymentStatus:'paid',
        review:{rating:4,comment:'Good service, fixed the leak quickly.',createdAt:daysAgo(2)},
        loyaltyPointsEarned:60, completedAt:daysAgo(2), paidAt:daysAgo(2),
        timeline:[{status:'requested',byRole:'customer',by:customers[1]._id,at:daysAgo(4)},{status:'completed',byRole:'worker',by:workers[1]._id,at:daysAgo(2)}]},
      { customer:customers[2]._id, worker:workers[2]._id, service:'Carpenter', description:'Wardrobe installation in bedroom',
        location:{type:'Point',coordinates:[73.8777,18.4900],address:'Hadapsar, Pune'}, scheduledDate:daysAgo(1),
        status:'completed', amount:2200, paymentMethod:'online', paymentStatus:'paid',
        review:{rating:5,comment:'Amazing craftsmanship! Highly recommended.',createdAt:daysAgo(0)},
        loyaltyPointsEarned:220, completedAt:daysAgo(0), paidAt:daysAgo(0),
        timeline:[{status:'requested',byRole:'customer',by:customers[2]._id,at:daysAgo(2)},{status:'completed',byRole:'worker',by:workers[2]._id,at:daysAgo(0)}]},
      { customer:customers[1]._id, worker:workers[5]._id, service:'Painter', description:'Living room interior painting',
        location:{type:'Point',coordinates:[73.9300,18.5600],address:'Viman Nagar, Pune'}, scheduledDate:daysAgo(14),
        status:'completed', amount:4500, paymentMethod:'online', paymentStatus:'paid',
        review:{rating:5,comment:'Beautiful finish! Very neat work.',createdAt:daysAgo(12)},
        loyaltyPointsEarned:450, completedAt:daysAgo(12), paidAt:daysAgo(12),
        timeline:[{status:'requested',byRole:'customer',by:customers[1]._id,at:daysAgo(15)},{status:'completed',byRole:'worker',by:workers[5]._id,at:daysAgo(12)}]},
      { customer:customers[2]._id, worker:workers[6]._id, service:'Cleaning', description:'Full home deep cleaning',
        location:{type:'Point',coordinates:[73.8777,18.4900],address:'Hadapsar, Pune'}, scheduledDate:daysAgo(5),
        status:'completed', amount:1200, paymentMethod:'upi', paymentStatus:'paid',
        review:{rating:4,comment:'Very thorough cleaning. Happy with the result.',createdAt:daysAgo(4)},
        loyaltyPointsEarned:120, completedAt:daysAgo(4), paidAt:daysAgo(4),
        timeline:[{status:'requested',byRole:'customer',by:customers[2]._id,at:daysAgo(6)},{status:'completed',byRole:'worker',by:workers[6]._id,at:daysAgo(4)}]},
      // Active bookings
      { customer:customers[0]._id, worker:workers[3]._id, service:'Mechanic', description:'Car servicing and oil change',
        location:{type:'Point',coordinates:[73.8567,18.5204],address:'Kothrud, Pune'}, scheduledDate:daysAhead(1),
        status:'accepted', amount:1500, paymentMethod:'upi', paymentStatus:'pending', loyaltyPointsEarned:0,
        timeline:[{status:'requested',byRole:'customer',by:customers[0]._id,at:daysAgo(1)},{status:'accepted',byRole:'worker',by:workers[3]._id,at:daysAgo(0)}]},
      { customer:customers[3]._id, worker:workers[4]._id, service:'Tutor', description:'Mathematics tutoring for Class 10',
        location:{type:'Point',coordinates:[73.8200,18.5500],address:'Baner, Pune'}, scheduledDate:daysAhead(2),
        status:'requested', amount:800, paymentMethod:'cash', paymentStatus:'pending', loyaltyPointsEarned:0,
        timeline:[{status:'requested',byRole:'customer',by:customers[3]._id,at:daysAgo(0)}]},
      { customer:customers[0]._id, worker:workers[0]._id, service:'Electrician', description:'New AC point wiring',
        location:{type:'Point',coordinates:[73.8567,18.5204],address:'Kothrud, Pune'}, scheduledDate:daysAhead(0),
        status:'in-progress', amount:900, paymentMethod:'upi', paymentStatus:'pending', loyaltyPointsEarned:0,
        timeline:[{status:'requested',byRole:'customer',by:customers[0]._id,at:daysAgo(1)},{status:'accepted',byRole:'worker',by:workers[0]._id,at:daysAgo(1)},{status:'in-progress',byRole:'worker',by:workers[0]._id,at:new Date()}]},
      { customer:customers[1]._id, worker:workers[1]._id, service:'Plumber', description:'Bathroom tap replacement',
        location:{type:'Point',coordinates:[73.9300,18.5600],address:'Viman Nagar, Pune'}, scheduledDate:daysAhead(0),
        status:'waiting-for-payment', amount:450, paymentMethod:'cash', paymentStatus:'pending', loyaltyPointsEarned:0,
        timeline:[{status:'requested',byRole:'customer',by:customers[1]._id,at:daysAgo(1)},{status:'waiting-for-payment',byRole:'worker',by:workers[1]._id,at:new Date()}]},
      // Cancelled / disputed
      { customer:customers[2]._id, worker:workers[3]._id, service:'Mechanic', description:'Bike repair',
        location:{type:'Point',coordinates:[73.8777,18.4900],address:'Hadapsar, Pune'}, scheduledDate:daysAgo(10),
        status:'cancelled', amount:600, paymentMethod:'cash', paymentStatus:'pending', loyaltyPointsEarned:0,
        cancellationReason:'Worker did not show up', cancelledBy:'customer',
        timeline:[{status:'requested',byRole:'customer',by:customers[2]._id,at:daysAgo(11)},{status:'cancelled',byRole:'customer',by:customers[2]._id,at:daysAgo(10)}]},
      { customer:customers[1]._id, worker:workers[1]._id, service:'Plumber', description:'Overhead tank cleaning',
        location:{type:'Point',coordinates:[73.9300,18.5600],address:'Viman Nagar, Pune'}, scheduledDate:daysAgo(20),
        status:'disputed', amount:800, paymentMethod:'cash', paymentStatus:'pending', hasDispute:true, loyaltyPointsEarned:0,
        timeline:[{status:'requested',byRole:'customer',by:customers[1]._id,at:daysAgo(21)},{status:'disputed',byRole:'customer',by:customers[1]._id,at:daysAgo(20)}]},
    ]);

    console.log('Created bookings');
