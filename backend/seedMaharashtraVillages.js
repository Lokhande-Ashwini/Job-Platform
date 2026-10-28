require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const hash = (pw) => bcrypt.hash(pw, 10);

const villages = [
  {
    name: 'Ralegan Siddhi',
    district: 'Ahmednagar',
    coords: [74.4172, 19.0308], // [longitude, latitude]
    workers: [
      { name: 'Amit Pawar', email: 'amit.siddhi@example.com', phone: '9822000001', skill: 'Electrician', rate: 250, exp: 6, rating: 4.7, bio: 'Residential wiring and solar panel maintenance in Ralegan Siddhi.' },
      { name: 'Sanjay Shinde', email: 'sanjay.siddhi@example.com', phone: '9822000002', skill: 'Plumber', rate: 220, exp: 5, rating: 4.5, bio: 'Leak repairs, borewell motor fitting, and pipeline services.' }
    ]
  },
  {
    name: 'Hiware Bazar',
    district: 'Ahmednagar',
    coords: [74.9000, 19.1230],
    workers: [
      { name: 'Dada Pawar', email: 'dada.hiware@example.com', phone: '9822000003', skill: 'Carpenter', rate: 300, exp: 8, rating: 4.8, bio: 'Modular kitchens, wardrobe fittings, and door repair services.' },
      { name: 'Mangal Yadav', email: 'mangal.hiware@example.com', phone: '9822000004', skill: 'Cleaner', rate: 180, exp: 4, rating: 4.6, bio: 'Complete home deep cleaning and sanitation specialist.' }
    ]
  },
  {
    name: 'Loni Kalbhor',
    district: 'Pune',
    coords: [74.0194, 18.4878],
    workers: [
      { name: 'Sunita Kalbhor', email: 'sunita.loni@example.com', phone: '9822000005', skill: 'Tutor', rate: 350, exp: 7, rating: 4.9, bio: 'Primary and secondary tutoring for Mathematics, Science, and English.' },
      { name: 'Satish Kalbhor', email: 'satish.loni@example.com', phone: '9822000006', skill: 'Mechanic', rate: 400, exp: 10, rating: 4.7, bio: 'Two-wheeler and tractor repairs at your doorstep in Loni Kalbhor.' }
    ]
  },
  {
    name: 'Khed Shivapur',
    district: 'Pune',
    coords: [73.8447, 18.3512],
    workers: [
      { name: 'Raju Khed', email: 'raju.khed@example.com', phone: '9822000007', skill: 'AC Technician', rate: 380, exp: 5, rating: 4.6, bio: 'Air conditioner installation, gas charging, and seasonal servicing.' },
      { name: 'Sachin Khed', email: 'sachin.khed@example.com', phone: '9822000008', skill: 'Painter', rate: 200, exp: 6, rating: 4.4, bio: 'Interior and exterior wall painting, damp proofing, and wall putty.' }
    ]
  },
  {
    name: 'Shirwal',
    district: 'Satara',
    coords: [73.9856, 18.1362],
    workers: [
      { name: 'Balaji Shirwal', email: 'balaji.shirwal@example.com', phone: '9822000009', skill: 'Electrician', rate: 260, exp: 7, rating: 4.5, bio: 'Certified electrician for home appliances, fans, and geysers.' },
      { name: 'Nikhil Shirwal', email: 'nikhil.shirwal@example.com', phone: '9822000010', skill: 'Plumber', rate: 240, exp: 4, rating: 4.3, bio: 'Emergency tap repairs, toilet fittings, and water tank washing.' }
    ]
  },
  {
    name: 'Bhigwan',
    district: 'Pune',
    coords: [74.7706, 18.2831],
    workers: [
      { name: 'Suresh Bhigwan', email: 'suresh.bhigwan@example.com', phone: '9822000011', skill: 'Carpenter', rate: 280, exp: 9, rating: 4.6, bio: 'Sofa repairs, window frames, and local wooden fixtures.' },
      { name: 'Kisan Bhigwan', email: 'kisan.bhigwan@example.com', phone: '9822000012', skill: 'Gardener', rate: 220, exp: 11, rating: 4.8, bio: 'Nursery layout, organic farm care, and decorative plant pruning.' }
    ]
  },
  {
    name: 'Shirdi',
    district: 'Ahmednagar',
    coords: [74.4789, 19.7662],
    workers: [
      { name: 'Babu Shirdi', email: 'babu.shirdi@example.com', phone: '9822000013', skill: 'Cleaner', rate: 200, exp: 5, rating: 4.7, bio: 'Hotel, lodge, and villa deep cleaning. Quick and reliable.' },
      { name: 'Vijay Shirdi', email: 'vijay.shirdi@example.com', phone: '9822000014', skill: 'Electrician', rate: 300, exp: 8, rating: 4.8, bio: 'Emergency light backup, UPS, and backup generator service.' }
    ]
  },
  {
    name: 'Trimbakeshwar',
    district: 'Nashik',
    coords: [73.5244, 19.9322],
    workers: [
      { name: 'Arun Trimbak', email: 'arun.trimbak@example.com', phone: '9822000015', skill: 'Tutor', rate: 300, exp: 6, rating: 4.8, bio: 'Sanskrit and Vedic Mathematics coaching for school children.' },
      { name: 'Milind Trimbak', email: 'milind.trimbak@example.com', phone: '9822000016', skill: 'Plumber', rate: 260, exp: 8, rating: 4.6, bio: 'Traditional copper piping and modern UPVC water supply fitting.' }
    ]
  },
  {
    name: 'Ganpatipule',
    district: 'Ratnagiri',
    coords: [73.2680, 17.1504],
    workers: [
      { name: 'Gopal Ganpati', email: 'gopal.ganpati@example.com', phone: '9822000017', skill: 'Painter', rate: 220, exp: 7, rating: 4.7, bio: 'Weatherproof coastal exterior paint specialist and wall artist.' },
      { name: 'Anant Ganpati', email: 'anant.ganpati@example.com', phone: '9822000018', skill: 'Mechanic', rate: 450, exp: 12, rating: 4.9, bio: 'Marine engine repairs and local light motor vehicle service.' }
    ]
  },
  {
    name: 'Harihareshwar',
    district: 'Raigad',
    coords: [73.0183, 17.9858],
    workers: [
      { name: 'Madhav Hari', email: 'madhav.hari@example.com', phone: '9822000019', skill: 'Gardener', rate: 250, exp: 9, rating: 4.8, bio: 'Coconut tree plantation, lawn setup, and resort garden maintenance.' },
      { name: 'Umesh Hari', email: 'umesh.hari@example.com', phone: '9822000020', skill: 'AC Technician', rate: 400, exp: 7, rating: 4.6, bio: 'Coastal AC servicing, anti-corrosion coating, and repairs.' }
    ]
  },
  {
    name: 'Velneshwar',
    district: 'Ratnagiri',
    coords: [73.1878, 17.3740],
    workers: [
      { name: 'Prasad Velne', email: 'prasad.velne@example.com', phone: '9822000021', skill: 'Electrician', rate: 280, exp: 8, rating: 4.7, bio: 'Household wiring, water heater installation, and earthing.' },
      { name: 'Vinayak Velne', email: 'vinayak.velne@example.com', phone: '9822000022', skill: 'Carpenter', rate: 320, exp: 10, rating: 4.8, bio: 'Local wood furniture, bed repair, and door lock installations.' }
    ]
  },
  {
    name: 'Patan',
    district: 'Satara',
    coords: [73.8967, 17.3739],
    workers: [
      { name: 'Sudhir Patan', email: 'sudhir.patan@example.com', phone: '9822000023', skill: 'Cleaner', rate: 190, exp: 5, rating: 4.5, bio: 'General house dusting, sweeping, and kitchen deep cleaning.' },
      { name: 'Amol Patan', email: 'amol.patan@example.com', phone: '9822000024', skill: 'Plumber', rate: 230, exp: 6, rating: 4.6, bio: 'Pipeline repairs, tap replacement, and wash basin block removal.' }
    ]
  },
  {
    name: 'Chichodi Patil',
    district: 'Ahmednagar',
    coords: [74.8770, 19.0550],
    workers: [
      { name: 'Sandip Patil', email: 'sandip.patil@example.com', phone: '9822000025', skill: 'Mechanic', rate: 380, exp: 9, rating: 4.7, bio: 'Tractor and farm equipment repair at reasonable pricing.' },
      { name: 'Datta Patil', email: 'datta.patil@example.com', phone: '9822000026', skill: 'Painter', rate: 210, exp: 5, rating: 4.5, bio: 'Durable oil paint and emulsion painting for rural homes.' }
    ]
  },
  {
    name: 'Pachora',
    district: 'Jalgaon',
    coords: [75.3470, 20.6690],
    workers: [
      { name: 'Devendra Pachora', email: 'devendra.pachora@example.com', phone: '9822000027', skill: 'Electrician', rate: 270, exp: 7, rating: 4.6, bio: 'Agrarian agricultural motor pump wiring and capacitor fittings.' },
      { name: 'Manisha Pachora', email: 'manisha.pachora@example.com', phone: '9822000028', skill: 'Tutor', rate: 300, exp: 6, rating: 4.9, bio: 'CBSE and State Board classes for high school science subjects.' }
    ]
  },
  {
    name: 'Wai',
    district: 'Satara',
    coords: [73.8900, 17.9400],
    workers: [
      { name: 'Govind Wai', email: 'govind.wai@example.com', phone: '9822000029', skill: 'Carpenter', rate: 340, exp: 11, rating: 4.9, bio: 'Custom timber woodworking and antique furniture restoration.' },
      { name: 'Vilas Wai', email: 'vilas.wai@example.com', phone: '9822000030', skill: 'Plumber', rate: 250, exp: 7, rating: 4.7, bio: 'Tiled bathrooms, hot/cold mixer taps, and geyser installations.' }
    ]
  }
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    const pw = await hash('password123');
    let added = 0;
    let skipped = 0;

    for (const vil of villages) {
      console.log(`📍 Processing village: ${vil.name} (${vil.district})`);
      
      // Let's offset the coordinates slightly for each worker so they don't overlap exactly on the map
      let offset = 0.001;
      
      for (const w of vil.workers) {
        const exists = await User.findOne({ email: w.email });
        if (exists) {
          skipped++;
          continue;
        }

        const workerCoords = [
          vil.coords[0] + (Math.random() > 0.5 ? offset : -offset) * Math.random(),
          vil.coords[1] + (Math.random() > 0.5 ? offset : -offset) * Math.random()
        ];

        await User.create({
          name: w.name,
          email: w.email,
          password: pw,
          phone: w.phone,
          role: 'worker',
          location: {
            type: 'Point',
            coordinates: workerCoords,
            address: `${vil.name}, ${vil.district}, Maharashtra`,
            city: vil.name,
            state: 'Maharashtra'
          },
          workerProfile: {
            skills: [w.skill],
            experience: w.exp,
            hourlyRate: w.rate,
            bio: w.bio,
            availability: true,
            rating: w.rating,
            totalJobs: Math.floor(Math.random() * 40) + 10,
            totalReviews: Math.floor(Math.random() * 20) + 5,
            completionRate: Math.floor(Math.random() * 10) + 90,
            verificationStatus: 'verified',
            isOnline: true
          }
        });
        added++;
        console.log(`   + Added Worker: ${w.name} (${w.skill})`);
      }
    }

    console.log(`\n🎉 Seed Finished! Added: ${added} new workers. Skipped: ${skipped} existing workers.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
    process.exit(1);
  }
};

seed();
