/**
 * WorkBridge seed script — seeds via live HTTP API.
 * Run: node seed-api.js
 */
const BASE = 'http://localhost:5001/api';

const req = async (method, path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(json)}`);
  return json;
};
const post = (p, b, t) => req('POST', p, b, t);
const put  = (p, b, t) => req('PUT',  p, b, t);
const get  = (p, t)    => req('GET',  p, null, t);

async function main() {
  console.log('🌱 Seeding WorkBridge via API...\n');

  // ── Accounts ─────────────────────────────────────────────────────────
  const admin = await post('/auth/signup', { name:'Admin User',    email:'admin@workbridge.com', password:'admin123',    role:'admin' });
  const alice = await post('/auth/signup', { name:'Alice Johnson', email:'alice@example.com',    password:'password123', role:'customer', location:{ city:'New York',      lat:40.7128, lng:-74.006  } });
  const bob   = await post('/auth/signup', { name:'Bob Smith',     email:'bob@example.com',      password:'password123', role:'customer', location:{ city:'Los Angeles',   lat:34.0522, lng:-118.244 } });
  const carol = await post('/auth/signup', { name:'Carol White',   email:'carol@example.com',    password:'password123', role:'customer', location:{ city:'Chicago',       lat:41.8781, lng:-87.630  } });

  const david = await post('/auth/signup', { name:'David Lee',   email:'david@example.com',  password:'password123', role:'provider', skills:['Plumbing','Pipe Fitting'],             hourlyRate:60, bio:'Licensed plumber with 8 years of experience.', location:{ city:'New York',      lat:40.73,   lng:-73.99   } });
  const emma  = await post('/auth/signup', { name:'Emma Davis',  email:'emma@example.com',   password:'password123', role:'provider', skills:['Tutoring','Math','Science'],            hourlyRate:35, bio:'PhD student offering maths and science tutoring.', location:{ city:'New York',    lat:40.70,   lng:-74.01   } });
  const frank = await post('/auth/signup', { name:'Frank Brown', email:'frank@example.com',  password:'password123', role:'provider', skills:['Electrical','Wiring','Electrician'],    hourlyRate:75, bio:'Certified electrician — residential & commercial.', location:{ city:'Chicago',     lat:41.88,   lng:-87.63   } });
  const grace = await post('/auth/signup', { name:'Grace Kim',   email:'grace@example.com',  password:'password123', role:'provider', skills:['Cleaning','Housekeeping'],              hourlyRate:25, bio:'Professional home cleaner. Eco-friendly products.', location:{ city:'Los Angeles', lat:34.06,   lng:-118.25  } });
  const henry = await post('/auth/signup', { name:'Henry Park',  email:'henry@example.com',  password:'password123', role:'provider', skills:['IT Support','Coding','Networking'],     hourlyRate:50, bio:'Full-stack developer & IT support specialist.', location:{ city:'San Francisco',lat:37.7749, lng:-122.42  } });
  const iris  = await post('/auth/signup', { name:'Iris Chen',   email:'iris@example.com',   password:'password123', role:'provider', skills:['Carpentry','Woodwork','Furniture'],     hourlyRate:55, bio:'Custom furniture maker and carpenter.', location:{ city:'New York',              lat:40.75,   lng:-73.98   } });

  console.log('✅ Accounts created');

  const aliceT = alice.token, bobT = bob.token, carolT = carol.token;
  const davidT = david.token, emmaT = emma.token, frankT = frank.token;
  const graceT = grace.token, henryT = henry.token, irisT = iris.token;

  // ── Subscribe Emma to Premium (demo for admin revenue) ──────────────
  await post('/subscriptions/subscribe', {}, emmaT);
  console.log('✅ Emma subscribed to Premium ($199)');

  // ── Jobs ──────────────────────────────────────────────────────────────
  const j1 = await post('/jobs', { title:'Fix leaking kitchen pipe', description:'Kitchen pipe under sink leaking badly, need urgent plumbing fix. Water pooling under cabinet.', budget:120, location:{ city:'New York', lat:40.71, lng:-74.0 }, hiringMode:'bidding', urgency:'high' }, aliceT);
  const j2 = await post('/jobs', { title:'Math tutoring for grade 10', description:'My daughter needs help with algebra and calculus for upcoming board exams. Weekly 2hr sessions for 4 weeks.', budget:180, location:{ city:'New York', lat:40.72, lng:-73.99 }, hiringMode:'bidding', urgency:'medium' }, aliceT);
  const j3 = await post('/jobs', { title:'Fix faulty bedroom wiring', description:'Bedroom circuit breaker keeps tripping and lights flicker badly. Needs proper electrical inspection and repair.', budget:250, location:{ city:'Chicago', lat:41.88, lng:-87.63 }, hiringMode:'bidding', urgency:'high' }, carolT);
  const j4 = await post('/jobs', { title:'Deep clean apartment before move-out', description:'Need full apartment deep cleaning including kitchen, bathrooms, all rooms, floors, and windows.', budget:80, location:{ city:'Los Angeles', lat:34.06, lng:-118.25 }, hiringMode:'direct', urgency:'medium' }, bobT);
  const j5 = await post('/jobs', { title:'Set up home WiFi mesh network', description:'Need to set up a mesh WiFi system across a 3-floor house. Configure parental controls and guest network.', budget:150, location:{ city:'New York', lat:40.73, lng:-74.0 }, hiringMode:'bidding', urgency:'low' }, aliceT);
  const j6 = await post('/jobs', { title:'Build custom bookshelf', description:'Need a floor-to-ceiling built-in bookshelf for living room. Dimensions: 8ft wide x 9ft tall. Light oak finish.', budget:350, location:{ city:'New York', lat:40.74, lng:-73.99 }, hiringMode:'bidding', urgency:'low' }, aliceT);
  const j7 = await post('/jobs', { title:'Weekly house cleaning service', description:'Looking for a reliable weekly cleaning service. 3-bedroom 2-bathroom apartment. About 3 hours each visit.', budget:90, location:{ city:'Los Angeles', lat:34.07, lng:-118.26 }, hiringMode:'direct', urgency:'low' }, bobT);
  // Extra jobs so David reaches 3 completions → auto-verified
  const j8 = await post('/jobs', { title:'Fix bathroom pipe leak', description:'Bathroom pipe behind the wall is leaking. Water stain on drywall. Need experienced plumber.', budget:150, location:{ city:'New York', lat:40.73, lng:-73.99 }, hiringMode:'direct', urgency:'high' }, carolT);
  const j9 = await post('/jobs', { title:'Install new water heater', description:'Old water heater needs replacing. 40-gallon gas water heater install in basement.', budget:200, location:{ city:'New York', lat:40.72, lng:-74.0 }, hiringMode:'direct', urgency:'medium' }, bobT);

  console.log('✅ Jobs created');

  // ── Admin verifies all providers so they can bid and appear in listings ──
  const adminUser = await post('/auth/login', { email:'admin@workbridge.com', password:'admin123' });
  const adminToken = adminUser.token;
  await Promise.all([david, emma, frank, grace, henry, iris].map(p =>
    put(`/admin/users/${p.user._id}/verify`, {}, adminToken)
  ));
  console.log('✅ All providers verified by admin');

  // ── Bids ──────────────────────────────────────────────────────────────
  const b1 = await post('/bids', { jobId:j1.job._id, amount:110, message:"I can fix this today! 8 years plumbing experience. Bring all tools and materials.", estimatedDays:1 }, davidT);
  const b2 = await post('/bids', { jobId:j2.job._id, amount:160, message:"PhD in Mathematics. I've helped 40+ students ace their board exams. Flexible schedule.", estimatedDays:28 }, emmaT);
  const b3 = await post('/bids', { jobId:j3.job._id, amount:220, message:"Certified electrician with 10 years residential & commercial experience. Safe and code-compliant work.", estimatedDays:1 }, frankT);
  const b5 = await post('/bids', { jobId:j5.job._id, amount:130, message:"Networking expert. Mesh WiFi setup done in one visit — guaranteed full coverage.", estimatedDays:1 }, henryT);
  const b6 = await post('/bids', { jobId:j6.job._id, amount:320, message:"Custom furniture specialist. I have the exact oak you need in stock. Check my portfolio.", estimatedDays:5 }, irisT);

  console.log('✅ Bids created');

  // ── Accept bids + complete jobs (generates commission transactions) ───
  // j4: direct hire Grace → mark completed → commission $8
  await put(`/jobs/${j4.job._id}/assign`, { providerId: grace.user._id }, bobT);
  await put(`/jobs/${j4.job._id}/status`, { status:'completed' }, bobT);

  // j1: accept David's bid → mark completed → commission $11
  await put(`/bids/${b1._id}/accept`, {}, aliceT);
  await put(`/jobs/${j1.job._id}/status`, { status:'completed' }, aliceT);

  // j2: accept Emma's bid → mark completed → commission $16
  await put(`/bids/${b2._id}/accept`, {}, aliceT);
  await put(`/jobs/${j2.job._id}/status`, { status:'completed' }, aliceT);

  // j3: accept Frank's bid → mark completed → commission $22
  await put(`/bids/${b3._id}/accept`, {}, carolT);
  await put(`/jobs/${j3.job._id}/status`, { status:'completed' }, carolT);

  // j7: direct hire Grace → stays in_progress
  await put(`/jobs/${j7.job._id}/assign`, { providerId: grace.user._id }, bobT);

  // j8, j9: direct hire David → completed → David hits 3 jobs → auto-verified
  await put(`/jobs/${j8.job._id}/assign`, { providerId: david.user._id }, carolT);
  await put(`/jobs/${j8.job._id}/status`, { status:'completed' }, carolT);
  await put(`/jobs/${j9.job._id}/assign`, { providerId: david.user._id }, bobT);
  await put(`/jobs/${j9.job._id}/status`, { status:'completed' }, bobT);

  console.log('✅ Jobs completed (commissions generated, David auto-verified)');

  // ── Reviews ───────────────────────────────────────────────────────────
  await post('/reviews', { jobId:j4.job._id, revieweeId:grace.user._id,  rating:5, comment:'Excellent work! The apartment looks brand new. Highly recommend Grace!' }, bobT);
  await post('/reviews', { jobId:j1.job._id, revieweeId:david.user._id,  rating:5, comment:'David fixed the pipe in under an hour. Very professional and clean work.' }, aliceT);
  await post('/reviews', { jobId:j2.job._id, revieweeId:emma.user._id,   rating:5, comment:'Emma is an amazing tutor! My daughter\'s grades improved significantly.' }, aliceT);
  await post('/reviews', { jobId:j3.job._id, revieweeId:frank.user._id,  rating:4, comment:'Frank did a thorough job. No more tripping breakers. Would hire again.' }, carolT);
  await post('/reviews', { jobId:j8.job._id, revieweeId:david.user._id,  rating:5, comment:'Fixed the bathroom leak quickly and cleanly. Highly recommend!' }, carolT);
  await post('/reviews', { jobId:j9.job._id, revieweeId:david.user._id,  rating:5, comment:'New water heater installed perfectly. David is a true professional.' }, bobT);

  console.log('✅ Reviews submitted');

  // ── Chat conversations ────────────────────────────────────────────────
  // Alice ↔ David (plumbing job)
  await post(`/chat/${david.user._id}`, { text:'Hi David, are you available this weekend for the pipe fix?' }, aliceT);
  await post(`/chat/${alice.user._id}`, { text:'Hi Alice! Yes, I can come Saturday morning around 9am.' }, davidT);
  await post(`/chat/${david.user._id}`, { text:'Perfect! Should I buy any parts beforehand?' }, aliceT);
  await post(`/chat/${alice.user._id}`, { text:'No need — I carry all standard fittings in my van. Just make sure to clear the under-sink cabinet.' }, davidT);
  await post(`/chat/${alice.user._id}`, { text:'My rate is $60/hr, should take about 2 hours max.' }, davidT);

  // Alice ↔ Emma (tutoring)
  await post(`/chat/${emma.user._id}`, { text:'Hi Emma! I saw your bid for math tutoring. Can we schedule a trial session first?' }, aliceT);
  await post(`/chat/${alice.user._id}`, { text:'Of course! How about this Sunday at 3pm? I can do it online or in-person.' }, emmaT);
  await post(`/chat/${emma.user._id}`, { text:'In-person would be great. We\'re in Upper East Side.' }, aliceT);
  await post(`/chat/${alice.user._id}`, { text:'Perfect, that works for me! I\'ll bring practice worksheets and past exam papers.' }, emmaT);

  // Bob ↔ Grace (cleaning)
  await post(`/chat/${grace.user._id}`, { text:'Hi Grace, loved your profile. How soon can you start the weekly cleaning?' }, bobT);
  await post(`/chat/${bob.user._id}`,   { text:'Hi Bob! I can start as early as this Thursday. I use eco-friendly products — is that okay?' }, graceT);
  await post(`/chat/${grace.user._id}`, { text:'That\'s actually perfect, we prefer eco products!' }, bobT);
  await post(`/chat/${bob.user._id}`,   { text:'Great! My cleaning kit includes HEPA vacuum, microfiber cloths and plant-based cleaners.' }, graceT);

  // Carol ↔ Frank (electrical)
  await post(`/chat/${frank.user._id}`, { text:'Frank, the wiring issue is getting worse. When can you come?' }, carolT);
  await post(`/chat/${carol.user._id}`, { text:'Hi Carol! I can come tomorrow evening or this weekend. Which works?' }, frankT);
  await post(`/chat/${frank.user._id}`, { text:'Tomorrow evening — say 6pm?' }, carolT);
  await post(`/chat/${carol.user._id}`, { text:'6pm works perfectly. Please make sure the main circuit breaker is accessible.' }, frankT);

  console.log('✅ Chat conversations seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:    admin@workbridge.com  / admin123');
  console.log('  Customer: alice@example.com     / password123');
  console.log('  Customer: bob@example.com       / password123');
  console.log('  Customer: carol@example.com     / password123');
  console.log('  Provider: david@example.com     / password123  (Plumber)');
  console.log('  Provider: emma@example.com      / password123  (Tutor) ⭐ Premium');
  console.log('  Provider: frank@example.com     / password123  (Electrician)');
  console.log('  Provider: grace@example.com     / password123  (Cleaner)');
  console.log('  Provider: henry@example.com     / password123  (IT Support)');
  console.log('  Provider: iris@example.com      / password123  (Carpenter)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

main().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });
