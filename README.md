# 🌉 WorkBridge — Skill-Based Micro Job Marketplace

A full-stack web application where customers post jobs, service providers bid and complete them, with AI-powered matching.

---

## 🗂 Project Structure

```
workbridge/
├── backend/                  # Node.js + Express API
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT auth middleware
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Bid.js
│   │   ├── Review.js
│   │   ├── Transaction.js
│   │   └── Message.js
│   ├── routes/               # API endpoints
│   │   ├── auth.js           # POST /login, /signup, GET /me
│   │   ├── jobs.js           # CRUD + AI analysis
│   │   ├── bids.js           # Bid lifecycle
│   │   ├── providers.js      # Provider directory
│   │   ├── chat.js           # Messaging
│   │   ├── reviews.js        # Ratings
│   │   ├── transactions.js   # Mock payments
│   │   └── admin.js          # Admin panel
│   ├── utils/
│   │   ├── aiHelpers.js      # Category detection + price suggestion
│   │   └── matchAlgorithm.js # Provider matching (skills/rating/distance)
│   ├── seed.js               # Demo data seeder
│   ├── server.js             # Entry point + Socket.io
│   └── .env
└── frontend/                 # React + Vite + Tailwind
    └── src/
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── components/       # Navbar, JobCard, ProviderCard, etc.
        └── pages/            # Login, Signup, Dashboards, etc.
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally (or use MongoDB Atlas)

---

### 1. Clone & Enter Project

```bash
cd workbridge
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create/edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/workbridge
JWT_SECRET=workbridge_super_secret_jwt_key_2024
NODE_ENV=development
```

Seed demo data:
```bash
npm run seed
```

Start backend:
```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role     | Email                      | Password    |
|----------|----------------------------|-------------|
| Admin    | admin@workbridge.com       | admin123    |
| Customer | alice@example.com          | password123 |
| Customer | bob@example.com            | password123 |
| Provider | david@example.com          | password123 (Plumber)    |
| Provider | emma@example.com           | password123 (Tutor)      |
| Provider | frank@example.com          | password123 (Electrician)|
| Provider | grace@example.com          | password123 (Cleaner)    |
| Provider | henry@example.com          | password123 (IT Support) |

---

## 📡 API Routes

### Auth
| Method | Route                | Description            |
|--------|----------------------|------------------------|
| POST   | /api/auth/signup     | Register new user      |
| POST   | /api/auth/login      | Login + JWT            |
| GET    | /api/auth/me         | Get current user       |
| PUT    | /api/auth/profile    | Update profile         |

### Jobs
| Method | Route                    | Description                         |
|--------|--------------------------|-------------------------------------|
| GET    | /api/jobs                | List jobs (filtered by role)        |
| GET    | /api/jobs/feed           | Provider job feed (skill-sorted)    |
| GET    | /api/jobs/categories     | All job categories                  |
| POST   | /api/jobs/analyze        | AI: detect category + suggest price |
| POST   | /api/jobs                | Create job (customer only)          |
| GET    | /api/jobs/:id            | Get single job                      |
| PUT    | /api/jobs/:id/status     | Update job status                   |
| PUT    | /api/jobs/:id/assign     | Direct hire a provider              |

### Bids
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| GET    | /api/bids/job/:jobId     | Bids for a job               |
| GET    | /api/bids/my             | Provider's own bids          |
| POST   | /api/bids                | Submit a bid (provider)      |
| PUT    | /api/bids/:id/accept     | Accept a bid (customer)      |
| PUT    | /api/bids/:id/reject     | Reject a bid (customer)      |

### Providers
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| GET    | /api/providers           | Browse providers (filtered)  |
| GET    | /api/providers/:id       | Provider profile + reviews   |
| GET    | /api/providers/:id/stats | Provider dashboard stats     |
| PUT    | /api/providers/availability | Toggle availability       |

### Reviews
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| POST   | /api/reviews             | Submit review                |
| GET    | /api/reviews/:userId     | Get user's reviews           |

### Chat
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| GET    | /api/chat/rooms          | Get all chat rooms           |
| GET    | /api/chat/:otherUserId   | Get message history          |
| POST   | /api/chat/:otherUserId   | Send a message               |

### Transactions
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| GET    | /api/transactions        | Get user's transactions      |
| POST   | /api/transactions/pay    | Mock payment simulation      |

### Admin (admin role only)
| Method | Route                    | Description                  |
|--------|--------------------------|------------------------------|
| GET    | /api/admin/stats         | Platform analytics           |
| GET    | /api/admin/users         | All users                    |
| GET    | /api/admin/jobs          | All jobs                     |
| DELETE | /api/admin/users/:id     | Delete user                  |

---

## 🎮 Demo Flow

1. **Login as Customer** (alice@example.com)
2. **Post a Job** — AI auto-detects category and suggests price
3. **Login as Provider** (david@example.com)
4. **Browse Job Feed** — see skill-matched jobs
5. **Place a Bid** on a job
6. **Switch back to Customer** → Accept the bid
7. **Mark job as Completed** → Pay (mock)
8. **Leave a Review**
9. **Admin login** → View analytics dashboard

---

## 🧠 AI Features

- **Category Detection**: Rule-based NLP scans title + description for keyword patterns
- **Price Suggestion**: Returns a min/max range based on detected category
- **Provider Matching**: Scores each provider by skill overlap (40%), rating (30%), distance (20%), price (10%)
- **Trust Score**: Calculated from completion rate + rating + response speed

## ⚡ Real-Time (Socket.io)

- New job posted → all connected providers notified
- Bid placed → customer notified
- Messages delivered in real-time
