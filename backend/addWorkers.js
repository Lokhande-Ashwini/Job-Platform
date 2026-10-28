require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const hash = (pw) => bcrypt.hash(pw, 10);

const workers = [
  // ── AHMEDNAGAR ──────────────────────────────────────────────────────────
  { name:'Rakesh Wiring Nagar', email:'rakesh.electric@nagar.com', phone:'9823100001', skill:'Electrician', rate:300, exp:7, rating:4.7, city:'Ahmednagar', state:'Maharashtra', coords:[74.7480, 19.0948], bio:'Expert in wiring, switchboards and electrical fittings in Ahmednagar.' },
  { name:'Santosh Plumber Nagar', email:'santosh.plumber@nagar.com', phone:'9823100002', skill:'Plumber', rate:280, exp:5, rating:4.5, city:'Ahmednagar', state:'Maharashtra', coords:[74.7490, 19.0960], bio:'Pipe fitting, bathroom installations and leak repairs in Ahmednagar.' },
  { name:'Ganesh Carpenter Nagar', email:'ganesh.carpenter@nagar.com', phone:'9823100003', skill:'Carpenter', rate:400, exp:9, rating:4.8, city:'Ahmednagar', state:'Maharashtra', coords:[74.7470, 19.0935], bio:'Custom furniture and modular kitchen specialist in Ahmednagar.' },
  { name:'Vikas Painter Nagar', email:'vikas.painter@nagar.com', phone:'9823100004', skill:'Painter', rate:220, exp:6, rating:4.4, city:'Ahmednagar', state:'Maharashtra', coords:[74.7500, 19.0970], bio:'Interior and exterior painting, texture work in Ahmednagar.' },
  { name:'Sunil Mechanic Nagar', email:'sunil.mechanic@nagar.com', phone:'9823100005', skill:'Mechanic', rate:450, exp:10, rating:4.6, city:'Ahmednagar', state:'Maharashtra', coords:[74.7460, 19.0920], bio:'Car and bike repair, doorstep service in Ahmednagar.' },

  // ── PUNE ────────────────────────────────────────────────────────────────
  { name:'Anil Electric Pune', email:'anil.electric@pune.com', phone:'9823200001', skill:'Electrician', rate:350, exp:8, rating:4.9, city:'Pune', state:'Maharashtra', coords:[73.8567, 18.5204], bio:'Certified electrician for residential and commercial in Pune.' },
  { name:'Ramesh AC Pune', email:'ramesh.ac@pune.com', phone:'9823200002', skill:'AC Technician', rate:400, exp:6, rating:4.7, city:'Pune', state:'Maharashtra', coords:[73.8600, 18.5250], bio:'AC installation, gas refill and servicing in Pune.' },
  { name:'Pradeep Tutor Pune', email:'pradeep.tutor@pune.com', phone:'9823200003', skill:'Tutor', rate:500, exp:5, rating:5.0, city:'Pune', state:'Maharashtra', coords:[73.9200, 18.5600], bio:'IIT graduate, Maths and Science tutor for 8th-12th in Pune.' },
  { name:'Kavita Clean Pune', email:'kavita.clean@pune.com', phone:'9823200004', skill:'Cleaner', rate:200, exp:4, rating:4.6, city:'Pune', state:'Maharashtra', coords:[73.8650, 18.5350], bio:'Professional home and office deep cleaning in Pune.' },
  { name:'Mahesh Garden Pune', email:'mahesh.garden@pune.com', phone:'9823200005', skill:'Gardener', rate:300, exp:7, rating:4.8, city:'Pune', state:'Maharashtra', coords:[73.8800, 18.5150], bio:'Lawn care, landscaping and terrace garden expert in Pune.' },

  // ── SATARA ──────────────────────────────────────────────────────────────
  { name:'Dnyanesh Electric Satara', email:'dnyanesh.electric@satara.com', phone:'9823300001', skill:'Electrician', rate:280, exp:6, rating:4.6, city:'Satara', state:'Maharashtra', coords:[74.0000, 17.6805], bio:'House wiring, fan and light installation in Satara.' },
  { name:'Balaji Plumber Satara', email:'balaji.plumber@satara.com', phone:'9823300002', skill:'Plumber', rate:260, exp:8, rating:4.7, city:'Satara', state:'Maharashtra', coords:[74.0050, 17.6850], bio:'Bore well, water tank and pipe repair specialist in Satara.' },
  { name:'Nitin Carpenter Satara', email:'nitin.carpenter@satara.com', phone:'9823300003', skill:'Carpenter', rate:380, exp:11, rating:4.9, city:'Satara', state:'Maharashtra', coords:[73.9950, 17.6780], bio:'Door frames, windows and furniture making in Satara.' },
  { name:'Ashok Painter Satara', email:'ashok.painter@satara.com', phone:'9823300004', skill:'Painter', rate:210, exp:5, rating:4.3, city:'Satara', state:'Maharashtra', coords:[74.0020, 17.6820], bio:'House painting and wall putty work in Satara.' },
  { name:'Raju Mechanic Satara', email:'raju.mechanic@satara.com', phone:'9823300005', skill:'Mechanic', rate:400, exp:9, rating:4.7, city:'Satara', state:'Maharashtra', coords:[73.9980, 17.6760], bio:'Two-wheeler and four-wheeler repair in Satara.' },

  // ── SANGLI ──────────────────────────────────────────────────────────────
  { name:'Prakash Electric Sangli', email:'prakash.electric@sangli.com', phone:'9823400001', skill:'Electrician', rate:290, exp:7, rating:4.6, city:'Sangli', state:'Maharashtra', coords:[74.5604, 16.8524], bio:'Industrial and residential electrician in Sangli.' },
  { name:'Sagar Plumber Sangli', email:'sagar.plumber@sangli.com', phone:'9823400002', skill:'Plumber', rate:270, exp:6, rating:4.5, city:'Sangli', state:'Maharashtra', coords:[74.5650, 16.8560], bio:'Bathroom fitting and underground pipe repair in Sangli.' },
  { name:'Vinayak Carpenter Sangli', email:'vinayak.carpenter@sangli.com', phone:'9823400003', skill:'Carpenter', rate:420, exp:12, rating:4.9, city:'Sangli', state:'Maharashtra', coords:[74.5560, 16.8490], bio:'Teak wood furniture and interior carpentry in Sangli.' },
  { name:'Sachin Mechanic Sangli', email:'sachin.mechanic@sangli.com', phone:'9823400004', skill:'Mechanic', rate:480, exp:14, rating:4.8, city:'Sangli', state:'Maharashtra', coords:[74.5580, 16.8510], bio:'Multi-brand car service and denting painting in Sangli.' },
  { name:'Asha Tutor Sangli', email:'asha.tutor@sangli.com', phone:'9823400005', skill:'Tutor', rate:350, exp:8, rating:4.9, city:'Sangli', state:'Maharashtra', coords:[74.5620, 16.8540], bio:'English and Science home tutor for CBSE and SSC in Sangli.' },

  // ── KOLHAPUR ────────────────────────────────────────────────────────────
  { name:'Suresh Electric Kolhapur', email:'suresh.electric@kolhapur.com', phone:'9823500001', skill:'Electrician', rate:310, exp:9, rating:4.7, city:'Kolhapur', state:'Maharashtra', coords:[74.2433, 16.7050], bio:'Solar panel installation and wiring expert in Kolhapur.' },
  { name:'Manoj Plumber Kolhapur', email:'manoj.plumber@kolhapur.com', phone:'9823500002', skill:'Plumber', rate:290, exp:7, rating:4.6, city:'Kolhapur', state:'Maharashtra', coords:[74.2480, 16.7080], bio:'Underground drainage and water line repair in Kolhapur.' },
  { name:'Rajendra Carpenter Kolhapur', email:'rajendra.carpenter@kolhapur.com', phone:'9823500003', skill:'Carpenter', rate:450, exp:15, rating:5.0, city:'Kolhapur', state:'Maharashtra', coords:[74.2400, 16.7020], bio:'Award winning master carpenter in Kolhapur - 15 yrs experience.' },
  { name:'Deepak AC Kolhapur', email:'deepak.ac@kolhapur.com', phone:'9823500004', skill:'AC Technician', rate:380, exp:5, rating:4.5, city:'Kolhapur', state:'Maharashtra', coords:[74.2460, 16.7060], bio:'Split AC and window AC repair, AMC services in Kolhapur.' },
  { name:'Neha Clean Kolhapur', email:'neha.clean@kolhapur.com', phone:'9823500005', skill:'Cleaner', rate:180, exp:3, rating:4.4, city:'Kolhapur', state:'Maharashtra', coords:[74.2450, 16.7040], bio:'Home and office cleaning with eco-friendly products in Kolhapur.' },

  // ── PAITHAN ─────────────────────────────────────────────────────────────
  { name:'Vitthal Electric Paithan', email:'vitthal.electric@paithan.com', phone:'9823600001', skill:'Electrician', rate:250, exp:5, rating:4.4, city:'Paithan', state:'Maharashtra', coords:[75.3833, 19.4667], bio:'Farm and house wiring specialist in Paithan area.' },
  { name:'Krishna Plumber Paithan', email:'krishna.plumber@paithan.com', phone:'9823600002', skill:'Plumber', rate:240, exp:6, rating:4.5, city:'Paithan', state:'Maharashtra', coords:[75.3850, 19.4680], bio:'Pipeline and water tank installation in Paithan.' },
  { name:'Tukaram Carpenter Paithan', email:'tukaram.carpenter@paithan.com', phone:'9823600003', skill:'Carpenter', rate:350, exp:8, rating:4.6, city:'Paithan', state:'Maharashtra', coords:[75.3820, 19.4650], bio:'Traditional and modern furniture making in Paithan.' },
  { name:'Balu Painter Paithan', email:'balu.painter@paithan.com', phone:'9823600004', skill:'Painter', rate:200, exp:4, rating:4.3, city:'Paithan', state:'Maharashtra', coords:[75.3840, 19.4660], bio:'Wall painting and waterproofing in Paithan.' },
  { name:'Nanda Garden Paithan', email:'nanda.garden@paithan.com', phone:'9823600005', skill:'Gardener', rate:250, exp:10, rating:4.7, city:'Paithan', state:'Maharashtra', coords:[75.3860, 19.4690], bio:'Kitchen garden, orchard and landscaping in Paithan.' },

  // ── SHRIGONDA ───────────────────────────────────────────────────────────
  { name:'Popat Electric Shrigonda', email:'popat.electric@shrigonda.com', phone:'9823700001', skill:'Electrician', rate:260, exp:6, rating:4.5, city:'Shrigonda', state:'Maharashtra', coords:[74.7011, 18.6253], bio:'Residential wiring and meter installation in Shrigonda.' },
  { name:'Laxman Plumber Shrigonda', email:'laxman.plumber@shrigonda.com', phone:'9823700002', skill:'Plumber', rate:250, exp:7, rating:4.6, city:'Shrigonda', state:'Maharashtra', coords:[74.7030, 18.6270], bio:'Borewell, overhead tank and pipe fitting in Shrigonda.' },
  { name:'Sambhaji Mechanic Shrigonda', email:'sambhaji.mechanic@shrigonda.com', phone:'9823700003', skill:'Mechanic', rate:350, exp:8, rating:4.5, city:'Shrigonda', state:'Maharashtra', coords:[74.6990, 18.6240], bio:'Farm vehicle and tractor repair in Shrigonda.' },
  { name:'Tai Clean Shrigonda', email:'tai.clean@shrigonda.com', phone:'9823700004', skill:'Cleaner', rate:160, exp:2, rating:4.3, city:'Shrigonda', state:'Maharashtra', coords:[74.7020, 18.6260], bio:'Household cleaning and utensil washing in Shrigonda.' },
  { name:'Kisan Garden Shrigonda', email:'kisan.garden@shrigonda.com', phone:'9823700005', skill:'Gardener', rate:220, exp:12, rating:4.8, city:'Shrigonda', state:'Maharashtra', coords:[74.7050, 18.6280], bio:'Mango orchards, flower gardens and vegetable patches in Shrigonda.' },

  // ── CHICHODI / PATIL ────────────────────────────────────────────────────
  { name:'Dattatray Electric Chichodi', email:'dattatray.electric@chichodi.com', phone:'9823800001', skill:'Electrician', rate:240, exp:5, rating:4.4, city:'Chichodi', state:'Maharashtra', coords:[74.4200, 18.9500], bio:'House wiring and pump connections in Chichodi village.' },
  { name:'Bhimrao Plumber Chichodi', email:'bhimrao.plumber@chichodi.com', phone:'9823800002', skill:'Plumber', rate:230, exp:6, rating:4.4, city:'Chichodi', state:'Maharashtra', coords:[74.4220, 18.9520], bio:'Water pipe and drainage specialist in Chichodi.' },
  { name:'Shankar Carpenter Chichodi', email:'shankar.carpenter@chichodi.com', phone:'9823800003', skill:'Carpenter', rate:330, exp:9, rating:4.7, city:'Chichodi', state:'Maharashtra', coords:[74.4180, 18.9480], bio:'Wooden doors, windows and furniture in Chichodi.' },
  { name:'Namdev Mechanic Chichodi', email:'namdev.mechanic@chichodi.com', phone:'9823800004', skill:'Mechanic', rate:320, exp:7, rating:4.5, city:'Chichodi', state:'Maharashtra', coords:[74.4210, 18.9510], bio:'Tractor and two-wheeler repair in Chichodi Patil.' },
  { name:'Jyoti Tutor Chichodi', email:'jyoti.tutor@chichodi.com', phone:'9823800005', skill:'Tutor', rate:280, exp:4, rating:4.6, city:'Chichodi', state:'Maharashtra', coords:[74.4230, 18.9530], bio:'Primary and secondary school tuition in Chichodi.' },

  // ── MUMBAI ──────────────────────────────────────────────────────────────
  { name:'Rajesh Electric Mumbai', email:'rajesh.electric@mumbai.com', phone:'9823900001', skill:'Electrician', rate:600, exp:12, rating:4.9, city:'Mumbai', state:'Maharashtra', coords:[72.8777, 19.0760], bio:'High-rise building wiring expert in Mumbai.' },
  { name:'Ajay Plumber Mumbai', email:'ajay.plumber@mumbai.com', phone:'9823900002', skill:'Plumber', rate:550, exp:10, rating:4.8, city:'Mumbai', state:'Maharashtra', coords:[72.8800, 19.0780], bio:'Commercial and residential plumbing in Mumbai.' },
  { name:'Sonal Tutor Mumbai', email:'sonal.tutor@mumbai.com', phone:'9823900003', skill:'Tutor', rate:700, exp:8, rating:5.0, city:'Mumbai', state:'Maharashtra', coords:[72.8820, 19.0800], bio:'CA and MBA entrance coaching in Mumbai.' },
  { name:'Irfan Painter Mumbai', email:'irfan.painter@mumbai.com', phone:'9823900004', skill:'Painter', rate:500, exp:9, rating:4.7, city:'Mumbai', state:'Maharashtra', coords:[72.8760, 19.0740], bio:'Designer wall art and texture painting in Mumbai.' },
  { name:'Priya AC Mumbai', email:'priya.ac@mumbai.com', phone:'9823900005', skill:'AC Technician', rate:600, exp:7, rating:4.8, city:'Mumbai', state:'Maharashtra', coords:[72.8840, 19.0820], bio:'24/7 emergency AC repair in Mumbai suburbs.' },

  // ── NASHIK ──────────────────────────────────────────────────────────────
  { name:'Yogesh Electric Nashik', email:'yogesh.electric@nashik.com', phone:'9824000001', skill:'Electrician', rate:320, exp:8, rating:4.7, city:'Nashik', state:'Maharashtra', coords:[73.7898, 19.9975], bio:'Solar and conventional electrical work in Nashik.' },
  { name:'Sandesh Plumber Nashik', email:'sandesh.plumber@nashik.com', phone:'9824000002', skill:'Plumber', rate:300, exp:7, rating:4.6, city:'Nashik', state:'Maharashtra', coords:[73.7920, 20.0000], bio:'Water purifier and pipeline installation in Nashik.' },
  { name:'Rohit Mechanic Nashik', email:'rohit.mechanic@nashik.com', phone:'9824000003', skill:'Mechanic', rate:430, exp:11, rating:4.8, city:'Nashik', state:'Maharashtra', coords:[73.7880, 19.9950], bio:'Premium car workshop owner offering doorstep in Nashik.' },

  // ── AURANGABAD ──────────────────────────────────────────────────────────
  { name:'Imran Electric Aurangabad', email:'imran.electric@aurangabad.com', phone:'9824100001', skill:'Electrician', rate:330, exp:9, rating:4.7, city:'Chhatrapati Sambhajinagar', state:'Maharashtra', coords:[75.3433, 19.8762], bio:'Industrial wiring and panel works in Aurangabad.' },
  { name:'Suryakant Carpenter Aurangabad', email:'suryakant.carpenter@aurangabad.com', phone:'9824100002', skill:'Carpenter', rate:400, exp:11, rating:4.8, city:'Chhatrapati Sambhajinagar', state:'Maharashtra', coords:[75.3460, 19.8780], bio:'Modular kitchen and wardrobe fitting in Aurangabad.' },
  { name:'Meera Clean Aurangabad', email:'meera.clean@aurangabad.com', phone:'9824100003', skill:'Cleaner', rate:220, exp:5, rating:4.5, city:'Chhatrapati Sambhajinagar', state:'Maharashtra', coords:[75.3410, 19.8740], bio:'Post-construction and regular cleaning in Aurangabad.' },

  // ── NAGPUR ──────────────────────────────────────────────────────────────
  { name:'Ravi Electric Nagpur', email:'ravi.electric@nagpur.com', phone:'9824200001', skill:'Electrician', rate:360, exp:10, rating:4.8, city:'Nagpur', state:'Maharashtra', coords:[79.0882, 21.1458], bio:'EV charging station and solar panel installation in Nagpur.' },
  { name:'Arjun Plumber Nagpur', email:'arjun.plumber@nagpur.com', phone:'9824200002', skill:'Plumber', rate:340, exp:8, rating:4.7, city:'Nagpur', state:'Maharashtra', coords:[79.0900, 21.1470], bio:'Commercial complex plumbing works in Nagpur.' },
  { name:'Savita Tutor Nagpur', email:'savita.tutor@nagpur.com', phone:'9824200003', skill:'Tutor', rate:400, exp:9, rating:4.9, city:'Nagpur', state:'Maharashtra', coords:[79.0870, 21.1440], bio:'NEET and JEE Biology expert in Nagpur.' },

  // ── DELHI ───────────────────────────────────────────────────────────────
  { name:'Harpreet Electric Delhi', email:'harpreet.electric@delhi.com', phone:'9824300001', skill:'Electrician', rate:500, exp:10, rating:4.8, city:'New Delhi', state:'Delhi', coords:[77.2090, 28.6139], bio:'Certified electrician for homes and offices in Delhi.' },
  { name:'Mohit Plumber Delhi', email:'mohit.plumber@delhi.com', phone:'9824300002', skill:'Plumber', rate:480, exp:9, rating:4.7, city:'New Delhi', state:'Delhi', coords:[77.2100, 28.6150], bio:'Emergency plumbing 24/7 in Delhi NCR.' },
  { name:'Sunita Tutor Delhi', email:'sunita.tutor@delhi.com', phone:'9824300003', skill:'Tutor', rate:800, exp:12, rating:5.0, city:'New Delhi', state:'Delhi', coords:[77.2080, 28.6130], bio:'IIT Delhi alumni coaching for JEE Advanced in Delhi.' },

  // ── BANGALORE ───────────────────────────────────────────────────────────
  { name:'Karthik Electric Bangalore', email:'karthik.electric@bangalore.com', phone:'9824400001', skill:'Electrician', rate:550, exp:11, rating:4.9, city:'Bengaluru', state:'Karnataka', coords:[77.5946, 12.9716], bio:'Smart home automation and wiring expert in Bangalore.' },
  { name:'Suresh Carpenter Bangalore', email:'suresh.carpenter@bangalore.com', phone:'9824400002', skill:'Carpenter', rate:600, exp:13, rating:4.9, city:'Bengaluru', state:'Karnataka', coords:[77.5960, 12.9730], bio:'IKEA style modular furniture and custom interiors in Bangalore.' },
  { name:'Lakshmi Tutor Bangalore', email:'lakshmi.tutor@bangalore.com', phone:'9824400003', skill:'Tutor', rate:900, exp:10, rating:5.0, city:'Bengaluru', state:'Karnataka', coords:[77.5930, 12.9700], bio:'Software programming tutor for Python, Java in Bangalore.' },

  // ── HYDERABAD ───────────────────────────────────────────────────────────
  { name:'Venkat Electric Hyderabad', email:'venkat.electric@hyderabad.com', phone:'9824500001', skill:'Electrician', rate:420, exp:9, rating:4.7, city:'Hyderabad', state:'Telangana', coords:[78.4867, 17.3850], bio:'Apartment complex wiring specialist in Hyderabad.' },
  { name:'Ravi AC Hyderabad', email:'ravi.ac@hyderabad.com', phone:'9824500002', skill:'AC Technician', rate:450, exp:8, rating:4.8, city:'Hyderabad', state:'Telangana', coords:[78.4880, 17.3860], bio:'All brand AC service, gas charging in Hyderabad.' },
  { name:'Padma Clean Hyderabad', email:'padma.clean@hyderabad.com', phone:'9824500003', skill:'Cleaner', rate:250, exp:6, rating:4.6, city:'Hyderabad', state:'Telangana', coords:[78.4850, 17.3840], bio:'Villa and apartment deep cleaning in Hyderabad.' },

  // ── CHENNAI ─────────────────────────────────────────────────────────────
  { name:'Murugan Electric Chennai', email:'murugan.electric@chennai.com', phone:'9824600001', skill:'Electrician', rate:460, exp:11, rating:4.8, city:'Chennai', state:'Tamil Nadu', coords:[80.2707, 13.0827], bio:'Generator and inverter installation in Chennai.' },
  { name:'Anand Plumber Chennai', email:'anand.plumber@chennai.com', phone:'9824600002', skill:'Plumber', rate:440, exp:10, rating:4.7, city:'Chennai', state:'Tamil Nadu', coords:[80.2720, 13.0840], bio:'Water sump and rooftop tank plumbing in Chennai.' },

  // ── AHMEDABAD ───────────────────────────────────────────────────────────
  { name:'Hardik Electric Ahmedabad', email:'hardik.electric@ahmedabad.com', phone:'9824700001', skill:'Electrician', rate:400, exp:8, rating:4.6, city:'Ahmedabad', state:'Gujarat', coords:[72.5714, 23.0225], bio:'Factory and residential wiring in Ahmedabad.' },
  { name:'Jignesh Mechanic Ahmedabad', email:'jignesh.mechanic@ahmedabad.com', phone:'9824700002', skill:'Mechanic', rate:480, exp:12, rating:4.8, city:'Ahmedabad', state:'Gujarat', coords:[72.5730, 23.0240], bio:'Luxury car service centre owner in Ahmedabad.' },
  { name:'Hetal Tutor Ahmedabad', email:'hetal.tutor@ahmedabad.com', phone:'9824700003', skill:'Tutor', rate:550, exp:9, rating:4.9, city:'Ahmedabad', state:'Gujarat', coords:[72.5700, 23.0210], bio:'CA Foundation and Intermediate coaching in Ahmedabad.' },

  // ── JAIPUR ──────────────────────────────────────────────────────────────
  { name:'Ramchandra Electric Jaipur', email:'ramchandra.electric@jaipur.com', phone:'9824800001', skill:'Electrician', rate:380, exp:9, rating:4.7, city:'Jaipur', state:'Rajasthan', coords:[75.7873, 26.9124], bio:'Hotel and resort electrical maintenance in Jaipur.' },
  { name:'Shyam Painter Jaipur', email:'shyam.painter@jaipur.com', phone:'9824800002', skill:'Painter', rate:350, exp:14, rating:4.9, city:'Jaipur', state:'Rajasthan', coords:[75.7890, 26.9140], bio:'Rajasthani wall art and heritage painting specialist in Jaipur.' },

  // ── KOLKATA ─────────────────────────────────────────────────────────────
  { name:'Subham Electric Kolkata', email:'subham.electric@kolkata.com', phone:'9824900001', skill:'Electrician', rate:350, exp:8, rating:4.6, city:'Kolkata', state:'West Bengal', coords:[88.3639, 22.5726], bio:'Residential and commercial electrical work in Kolkata.' },
  { name:'Anirban Tutor Kolkata', email:'anirban.tutor@kolkata.com', phone:'9824900002', skill:'Tutor', rate:600, exp:11, rating:4.9, city:'Kolkata', state:'West Bengal', coords:[88.3650, 22.5740], bio:'Physics and Chemistry tutor for WBJEE and JEE in Kolkata.' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs');
    console.log('Connected to MongoDB\n');

    const pw = await hash('password123');
    let added = 0, skipped = 0;

    for (const w of workers) {
      const exists = await User.findOne({ email: w.email });
      if (exists) { skipped++; continue; }

      await User.create({
        name: w.name,
        email: w.email,
        password: pw,
        phone: w.phone,
        role: 'worker',
        location: {
          type: 'Point',
          coordinates: w.coords,
          address: `${w.city}, ${w.state}`,
          city: w.city,
          state: w.state,
        },
        workerProfile: {
          skills: [w.skill],
          experience: w.exp,
          hourlyRate: w.rate,
          bio: w.bio,
          availability: true,
          rating: w.rating,
          totalJobs: Math.floor(Math.random() * 150) + 20,
          totalReviews: Math.floor(Math.random() * 100) + 10,
          completionRate: Math.floor(Math.random() * 10) + 90,
          verificationStatus: 'verified',
          isOnline: Math.random() > 0.4,
        },
      });
      added++;
      process.stdout.write(`Added: ${w.name} (${w.city})\n`);
    }

    console.log(`\n✅ Done! Added: ${added} workers, Skipped (already exist): ${skipped}`);
    console.log('\nCities covered:');
    const cities = [...new Set(workers.map(w => w.city))];
    cities.forEach(c => console.log(`  • ${c}`));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();
