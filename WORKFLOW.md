# Platform Workflow

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN (ONE ONLY)                      │
│  Created via: node createAdmin.js                        │
│  Email: admin@test.com | Password: admin123             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │      Admin Panel Dashboard            │
        │  - View platform statistics           │
        │  - See pending workers                │
        │  - Verify/Reject workers              │
        │  - View analytics                     │
        └───────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                    WORKER REGISTRATION                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                  Register on Website
                  (Select Worker Role)
                            │
                            ▼
                  Status: PENDING ⏳
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Worker Dashboard Shows:             │
        │   "⏳ Verification Pending"           │
        │   "Wait for admin approval"           │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Admin Reviews Worker                │
        │   - Views skills, experience          │
        │   - Checks details                    │
        │   - Makes decision                    │
        └───────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ✓ VERIFY                  ✗ REJECT
                │                       │
                ▼                       ▼
    Status: VERIFIED          Status: REJECTED
                │                       │
                ▼                       ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ ✅ Verified     │      │ ❌ Rejected     │
    │ Can receive     │      │ Cannot receive  │
    │ bookings        │      │ bookings        │
    │ Appears in      │      │ Hidden from     │
    │ search          │      │ search          │
    └─────────────────┘      └─────────────────┘


┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER REGISTRATION                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                  Register on Website
                  (Select Customer Role)
                            │
                            ▼
                  Status: ACTIVE ✅
                  (No approval needed)
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Customer Can:                       │
        │   - Search for workers                │
        │   - See ONLY verified workers         │
        │   - Book services                     │
        │   - Leave reviews                     │
        │   - Earn loyalty points               │
        └───────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                    BOOKING WORKFLOW                      │
└─────────────────────────────────────────────────────────┘

Customer                    Worker                    Status
   │                          │                         │
   │ 1. Search Workers        │                         │
   │ (Only verified)          │                         │
   │                          │                         │
   │ 2. Book Service ────────>│                    PENDING
   │                          │                         │
   │                          │ 3. Accept Booking       │
   │<─────────────────────────│                    ACCEPTED
   │                          │                         │
   │                          │ 4. On The Way           │
   │<─────────────────────────│                  ON-THE-WAY
   │                          │                         │
   │                          │ 5. Start Job            │
   │<─────────────────────────│                  IN-PROGRESS
   │                          │                         │
   │                          │ 6. Complete Job         │
   │<─────────────────────────│                   COMPLETED
   │                          │                         │
   │ 7. Leave Review ────────>│                         │
   │                          │ (Rating updated)        │
   │                          │                         │
   │ 8. Pay ─────────────────>│                    PAID
   │ (Earn loyalty points)    │ (Earn money)            │
   │                          │                         │


┌─────────────────────────────────────────────────────────┐
│                    KEY FEATURES                          │
└─────────────────────────────────────────────────────────┘

✅ Smart Recommendation - Top workers shown first
✅ Worker Verification - Admin approval required
✅ Emergency Booking - Priority service with extra charge
✅ Price Estimation - Automatic cost calculation
✅ Reviews & Ratings - 5-star system
✅ Earnings Analytics - Charts for workers
✅ Loyalty Points - Rewards for customers
✅ Notifications - Real-time updates
✅ Service History - Timeline view
✅ Admin Panel - Complete platform management
✅ Job Workflow - 6-stage process


┌─────────────────────────────────────────────────────────┐
│                    SECURITY RULES                        │
└─────────────────────────────────────────────────────────┘

1. Only ONE admin can exist
2. Workers need admin verification
3. Only verified workers appear in search
4. Customers can register freely
5. JWT authentication for all users
6. Role-based access control
7. Admin-only routes protected
```

---

## 🎯 Quick Summary

**Admin:** 1 user, manages everything
**Workers:** Need verification, then can receive bookings
**Customers:** Register freely, book verified workers only

**Workflow:** Register → Verify (workers only) → Book → Complete → Review → Pay
