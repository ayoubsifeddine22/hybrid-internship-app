# Architecture Diagram

## Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATIONS                        │
├─────────────────────┬──────────────────┬───────────────────────┤
│   Enterprise        │     Student      │      Admin            │
│   Dashboard         │     Dashboard    │      Dashboard        │
│  (React)            │     (React)      │      (React)          │
└─────────────────────┴──────────────────┴───────────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │   API Requests   │
                    │  (HTTP/JSON)     │
                    └──────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Auth API   │     │ Enterprise  │     │   Admin     │
│             │     │    API      │     │    API      │
│ - Register  │     │             │     │             │
│ - Login     │     │ - Post      │     │ - Manage    │
│ - Logout    │     │   Offers    │     │   Users     │
└──────┬──────┘     │ - View      │     │ - View      │
       │            │   Apps      │     │   Stats     │
       └─────────┬──┴─────────────┴─────┴─────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   SERVER.JS        │
        │  (Express App)     │
        └────────┬───────────┘
                 │
        ┌────────┴──────────┬──────────────────┐
        │                   │                  │
        ▼                   ▼                  ▼
    ┌────────┐         ┌──────────┐     ┌─────────────┐
    │Routing │         │Middleware│     │Error        │
    │        │         │          │     │Handling     │
    │/auth   │         │- Auth    │     │             │
    │/ent..  │         │- CORS    │     │             │
    │/student│         │- Parser  │     │             │
    │/admin  │         └──────────┘     └─────────────┘
    └────────┘
        │
        ▼
    ┌───────────────────────────────────────────┐
    │        BUSINESS LOGIC LAYER               │
    ├──────────┬───────────┬────────┬───────────┤
    │Controllers    Middleware  Utils  Models  │
    │                                           │
    │ - User Auth         - Scoring Algorithm   │
    │ - Offers CRUD       - Match Calculation   │
    │ - Applications      - Auth Verification  │
    │ - Matching Logic                         │
    └────────────┬────────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
        ▼                   ▼
    ┌──────────────┐   ┌──────────────┐
    │   Config     │   │ Scoring      │
    │ - DB Pool    │   │ Algorithm    │
    │ - Connection │   │              │
    │              │   │ 50% Skills   │
    │              │   │ 30% Diploma  │
    │              │   │ 20% Location │
    └──────┬───────┘   │              │
           │           │ Score ≥ 0.8? │
           │           │ → Auto-grant  │
           ▼           └──────────────┘
    ┌───────────────────────┐
    │   MySQL Database      │
    ├───────────────────────┤
    │ Tables:               │
    │ - users               │
    │ - enterprise_profiles │
    │ - student_profiles    │
    │ - student_skills      │
    │ - internship_offers   │
    │ - applications        │
    │ - notifications       │
    │ - admin_logs          │
    └───────────────────────┘
```

---

## Request/Response Cycle Example

### Example 1: Student Applying for Internship

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Student clicks "Apply" in React Frontend          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Frontend sends POST request to API                │
│  POST /api/student/applications                            │
│  Body: {                                                    │
│    offerId: 5,                                              │
│    studentId: 12,                                           │
│    skills: ['JavaScript', 'React', 'Node.js'],             │
│    diploma: 'bachelor',                                     │
│    location: 'Paris'                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Server receives request at /api/student/appl..   │
│  Routes: student.js routes request to controller           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Controller processes request                      │
│  - Validates student data                                  │
│  - Fetches offer details from database                     │
│  - Calls scoring algorithm                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Scoring Algorithm Calculates Match Score         │
│  Offer requires: JavaScript, React, Bachelor, Paris       │
│  Student has: JavaScript, React, Node.js, Bachelor, Paris │
│                                                            │
│  Skills: 2 out of 2 required = 1.0 × 0.5 = 0.5           │
│  Diploma: Bachelor matches = 1.0 × 0.3 = 0.3              │
│  Location: Paris matches = 1.0 × 0.2 = 0.2                │
│  ──────────────────────────────────────────────            │
│  TOTAL SCORE = 0.5 + 0.3 + 0.2 = 1.0 ✓✓✓                 │
│                                                            │
│  Decision: Score 1.0 ≥ 0.8 → AUTO-GRANT!                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Save to Database                                 │
│  - Create application record with score 1.0               │
│  - Set status to 'accepted'                                │
│  - Update offer status if this was the first acceptance   │
│  - Create notification records                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Send Notifications                               │
│  - Notify student: "Congratulations! Offer granted!"      │
│  - Notify enterprise: "Your offer was granted to [name]"  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Server sends response to Frontend                │
│  {                                                         │
│    success: true,                                          │
│    message: "Application accepted!",                       │
│    matchScore: 1.0,                                        │
│    status: 'accepted'                                      │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: Frontend updates UI                              │
│  Shows success message to student                          │
│  Updates offer status                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow for Auto-Selection (When Offer Expires)

```
SCHEDULED JOB (Runs daily at midnight)
│
▼
Check if any offers have reached deadline today
│
▼
For each expired offer:
  │
  ├─→ Get all pending applications for this offer
  │
  ├─→ Sort by match score (highest first)
  │
  ├─→ Select highest scoring student
  │
  ├─→ Update application status to 'auto_selected'
  │
  ├─→ Reject all other applications
  │
  ├─→ Send notifications:
  │   ├─→ Selected student: "You were selected for this offer!"
  │   └─→ Enterprise: "Application winner selected"
  │
  └─→ Update offer status to 'filled'
```

---

## Authentication Flow

```
┌──────────────────────────────┐
│  User Registration/Login     │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ POST /api/auth/register      │
│ or POST /api/auth/login      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Controller validates credentials     │
│ Checks database for user             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Password comparison (bcrypt)         │
│ Match? → Generate JWT Token          │
│ No match? → Return error             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Server returns JWT token to client   │
│ Token stored in client (localStorage)│
└──────────────────────────────────────┘


SUBSEQUENT API REQUESTS:

┌──────────────────────────────────────────────┐
│ Client sends request with JWT in header:     │
│ Authorization: Bearer <jwt_token>            │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Server receives request                      │
│ Middleware (verifyToken) checks JWT         │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Valid token?                                 │
│ → Extract user info from token              │
│ → Continue to route handler                 │
│                                              │
│ Invalid/Expired token?                      │
│ → Return 401 Unauthorized                   │
└──────────────────────────────────────────────┘
```

---

## Folder Structure Tree

```
hybrid-internship-app/
│
├── config/
│   └── database.js (MySQL connection pool)
│
├── database/
│   └── schema.sql (SQL table definitions)
│
├── routes/
│   ├── auth.js (authentication endpoints)
│   ├── enterprise.js (enterprise endpoints)
│   ├── student.js (student endpoints)
│   └── admin.js (admin endpoints)
│
├── controllers/ (to be implemented)
│   ├── authController.js
│   ├── enterpriseController.js
│   ├── studentController.js
│   └── adminController.js
│
├── models/ (to be implemented)
│   ├── User.js
│   ├── Offer.js
│   ├── Application.js
│   └── Notification.js
│
├── middleware/
│   └── auth.js (JWT verification, role authorization)
│
├── utils/
│   └── scoring.js (match score calculation)
│
├── public/ (React frontend - Phase 6)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
│
├── server.js (main application entry)
├── package.json (dependencies)
├── .env.example (environment template)
├── .gitignore (files to exclude)
├── README.md (project overview)
├── STRUCTURE.md (detailed documentation)
├── QUICKSTART.md (getting started guide)
└── ARCHITECTURE.md (this file)
```

---

## Component Responsibilities

### SERVER.JS
- Express app initialization
- Middleware setup
- Route mounting
- Error handling
- Server startup

### ROUTES
- Define API endpoints
- Request parsing
- Response formatting
- Route-specific validation

### CONTROLLERS
- Business logic
- Database queries through models
- Error handling
- Response preparation

### MODELS
- Direct database interactions
- Query building
- Data transformation
- Reusable functions

### MIDDLEWARE
- Cross-cutting concerns
- Authentication
- Authorization
- Request validation

### UTILS
- Helper functions
- Algorithms (scoring)
- Formatting utilities
- Calculations

### CONFIG
- Environment setup
- Database connections
- Reusable settings

---

This architecture ensures:
✓ **Separation of Concerns** - Each part has one responsibility
✓ **Reusability** - Functions can be used across controllers
✓ **Testability** - Each component can be tested independently
✓ **Scalability** - Easy to add new routes, controllers, models
✓ **Maintainability** - Clear structure makes debugging easier
