const http = require('http');

const post = (path, body, token) => new Promise(r => {
  const d = JSON.stringify(body);
  const opts = {
    hostname: 'localhost', port: 5000, path: '/api' + path, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), ...(token ? { Authorization: 'Bearer ' + token } : {}) }
  };
  const req = http.request(opts, res => {
    let s = ''; res.on('data', c => s += c);
    res.on('end', () => { try { r({ status: res.statusCode, ok: res.statusCode < 400, body: JSON.parse(s) }); } catch { r({ status: res.statusCode, ok: res.statusCode < 400, body: s }); } });
  });
  req.on('error', () => r({ status: 0, ok: false, body: {} }));
  req.write(d); req.end();
});

const get = (path, token) => new Promise(r => {
  const opts = {
    hostname: 'localhost', port: 5000, path: '/api' + path, method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
  };
  const req = http.request(opts, res => {
    let s = ''; res.on('data', c => s += c);
    res.on('end', () => r({ status: res.statusCode, ok: res.statusCode < 400 }));
  });
  req.on('error', () => r({ status: 0, ok: false }));
  req.end();
});

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        HYPERLOCAL JOBS — END-TO-END API TESTS       ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Login all 3 roles
  const aL = await post('/auth/login', { email: 'admin@test.com', password: 'admin123' });
  const cL = await post('/auth/login', { email: 'rahul@example.com', password: 'password123' });
  const wL = await post('/auth/login', { email: 'suresh.electric@example.com', password: 'password123' });

  const at = aL.body.token;
  const ct = cL.body.token;
  const wt = wL.body.token;

  console.log('── LOGIN TESTS ─────────────────────────────────────────');
  console.log('Admin login:    ' + (aL.ok && at ? '✅ PASS' : '❌ FAIL') + ' [' + aL.status + ']');
  console.log('Customer login: ' + (cL.ok && ct ? '✅ PASS' : '❌ FAIL') + ' [' + cL.status + ']');
  console.log('Worker login:   ' + (wL.ok && wt ? '✅ PASS' : '❌ FAIL') + ' [' + wL.status + ']');

  if (!at) { console.log('\n❌ Admin token missing. Run: node demoSeed.js'); process.exit(1); }

  const tests = [
    // Profile
    ['PROFILE', 'Admin get profile',          get('/auth/profile', at)],
    ['PROFILE', 'Customer get profile',        get('/auth/profile', ct)],
    ['PROFILE', 'Worker get profile',          get('/auth/profile', wt)],

    // Workers
    ['WORKERS', 'Search all workers',          get('/workers/search', at)],
    ['WORKERS', 'Search by skill Electrician', get('/workers/search?skill=Electrician', at)],
    ['WORKERS', 'Search by skill Plumber',     get('/workers/search?skill=Plumber', at)],
    ['WORKERS', 'Search by skill Carpenter',   get('/workers/search?skill=Carpenter', at)],
    ['WORKERS', 'Search near Pune (lat/lng)',  get('/workers/search?skill=Electrician&lat=18.5204&lng=73.8567&radius=50000', at)],
    ['WORKERS', 'Search near Mumbai',          get('/workers/search?skill=Plumber&lat=19.0760&lng=72.8777&radius=30000', at)],
    ['WORKERS', 'Search near Kolhapur',        get('/workers/search?skill=Carpenter&lat=16.7050&lng=74.2433&radius=50000', at)],

    // Bookings
    ['BOOKINGS', 'Admin get all bookings',     get('/bookings', at)],
    ['BOOKINGS', 'Customer bookings',          get('/bookings?limit=5', ct)],
    ['BOOKINGS', 'Worker bookings',            get('/bookings?limit=5', wt)],
    ['BOOKINGS', 'Worker analytics',           get('/bookings/analytics/worker', wt)],
    ['BOOKINGS', 'Service history',            get('/bookings/history', ct)],

    // Notifications
    ['NOTIF', 'Admin unread counts',           get('/notifications/unread-counts', at)],
    ['NOTIF', 'Customer unread counts',        get('/notifications/unread-counts', ct)],
    ['NOTIF', 'Worker unread counts',          get('/notifications/unread-counts', wt)],
    ['NOTIF', 'Get notifications list',        get('/notifications', ct)],

    // Quotes
    ['QUOTES', 'Admin review queue',           get('/quotes/admin/review', at)],
    ['QUOTES', 'Customer quotes (incoming)',    get('/quotes/incoming', ct)],
    ['QUOTES', 'Worker quotes (my)',            get('/quotes/my', wt)],

    // Disputes
    ['DISPUTES', 'Admin all disputes',         get('/disputes', at)],
    ['DISPUTES', 'Customer my disputes',       get('/disputes/my', ct)],
    ['DISPUTES', 'Worker my disputes',         get('/disputes/my', wt)],

    // Support Tickets
    ['TICKETS', 'Admin all tickets',           get('/tickets', at)],
    ['TICKETS', 'Customer my tickets',         get('/tickets/my', ct)],
    ['TICKETS', 'Worker my tickets',           get('/tickets/my', wt)],

    // Messages
    ['MESSAGES', 'Conversations list',         get('/messages/conversations', ct)],
    ['MESSAGES', 'Admin threads',              get('/support/threads/all', at)],

    // Admin
    ['ADMIN', 'Platform stats',                get('/admin/stats', at)],
    ['ADMIN', 'All workers list',              get('/admin/workers', at)],
    ['ADMIN', 'All customers list',            get('/admin/customers', at)],
    ['ADMIN', 'Pending verification',          get('/admin/workers/pending', at)],
    ['ADMIN', 'All bookings',                  get('/admin/bookings', at)],

    // Finance
    ['FINANCE', 'Worker earnings',             get('/finance/worker/earnings', wt)],
    ['FINANCE', 'Customer transactions',       get('/finance/customer/transactions', ct)],
    ['FINANCE', 'Admin profit analytics',      get('/finance/admin/profit-analytics', at)],
    ['FINANCE', 'Admin all payouts',           get('/finance/admin/payouts', at)],
    ['FINANCE', 'Admin tax summary',           get('/finance/admin/tax-summary', at)],
    ['FINANCE', 'Platform settings',           get('/finance/admin/settings', at)],
    ['FINANCE', 'Admin revenue',               get('/finance/admin/revenue', at)],

    // Payments
    ['PAYMENTS', 'Payment summary',            get('/payments/summary', ct)],

    // AI Engine
    ['AI', 'Suspicious flags',                 get('/ai/suspicious-flags', at)],
    ['AI', 'Review analytics',                 get('/ai/review-analytics', at)],
    ['AI', 'Price fairness Electrician',       get('/ai/price-fairness?skill=Electrician&hourlyRate=350', at)],
    ['AI', 'Price fairness Plumber',           get('/ai/price-fairness?skill=Plumber&hourlyRate=280', at)],

    // Worker Requests
    ['WRK-REQ', 'Worker change requests',      get('/worker-requests/my', wt)],

    // Health — note: /health is NOT under /api prefix
    ['HEALTH', 'Server health check',          new Promise(r => {
      const opts = { hostname:'localhost', port:5000, path:'/health', method:'GET' };
      const req = http.request(opts, res => { let s=''; res.on('data',c=>s+=c); res.on('end',()=>r({status:res.statusCode,ok:res.statusCode<400})); });
      req.on('error',()=>r({status:0,ok:false})); req.end();
    })],
  ];

  const results = await Promise.all(tests.map(async ([module, label, promise]) => {
    const r = await promise;
    return { module, label, ok: r.ok, status: r.status };
  }));

  // Group by module
  const modules = {};
  results.forEach(r => {
    if (!modules[r.module]) modules[r.module] = [];
    modules[r.module].push(r);
  });

  let totalPass = 3, totalFail = 0; // count the 3 logins
  if (!aL.ok || !at) totalFail++;
  if (!cL.ok || !ct) totalFail++;
  if (!wL.ok || !wt) totalFail++;

  Object.entries(modules).forEach(([mod, tests]) => {
    console.log('\n── ' + mod + ' ─────────────────────────────────────────────');
    tests.forEach(r => {
      const icon = r.ok ? '✅' : '❌';
      const label = (r.label + '                              ').substring(0, 32);
      console.log(icon + ' ' + label + '[' + r.status + ']');
      if (r.ok) totalPass++; else totalFail++;
    });
  });

  const total = totalPass + totalFail;
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  RESULTS: ' + totalPass + ' PASS / ' + totalFail + ' FAIL / ' + total + ' TOTAL TESTS' + '          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (totalFail > 0) {
    console.log('❌ FAILED TESTS:');
    results.filter(r => !r.ok).forEach(r => console.log('   • [' + r.module + '] ' + r.label + ' → HTTP ' + r.status));
  } else {
    console.log('🎉 ALL TESTS PASSED!\n');
  }
}

run().catch(console.error);
