# Project Structure Documentation

## Overview

The Hybrid Internship App is organized into logical folders, each with a specific purpose. This document explains each folder and its role in the application.

---

## Folder Structure

### 📁 `/config`
**Purpose**: Configuration files for the application

**Files**:
- `database.js` - MySQL database connection pool configuration
  - Handles connection pooling for efficient database management
  - Exports `pool` for database queries and `testConnection()` for verification

**When to use**:
- Import `pool` when you need to query the database
- Call `testConnection()` during server startup to verify database connection

---

### 📁 `/database`
**Purpose**: Database schema and migration files

**Files**:
- `schema.sql` - SQL queries for creating all database tables
  - Contains comments for each table explaining its purpose
  - Tables are currently commented out (wrapped in `/* */`)
  - Execute each query in PHPMyAdmin after creating the database

**Tables to be created**:
1. `users` - All users (enterprises, students, admins)
2. `enterprise_profiles` - Extended enterprise info
3. `student_profiles` - Extended student info
4. `student_skills` - Skills each student has
5. `internship_offers` - Job postings by enterprises
6. `offer_required_skills` - Required skills for each offer
7. `applications` - Student applications
8. `notifications` - User notifications
9. `admin_logs` - Audit trail of admin actions

---

### 📁 `/routes`
**Purpose**: API endpoint definitions

**Files**:
- `auth.js` - Authentication endpoints (register, login, logout)
- `enterprise.js` - Enterprise space endpoints (post offers, view applications)
- `student.js` - Student space endpoints (browse offers, apply)
- `admin.js` - Admin space endpoints (manage users, statistics)

**How it works**:
- Each file defines routes for that specific area
- Routes are imported in `server.js` and mounted at specific paths
- Example: `POST /api/auth/register` calls the endpoint in `auth.js`

---

### 📁 `/controllers`
**Purpose**: Business logic for handling requests (to be implemented)

**What will go here**:
- Functions that process data from routes
- Database queries
- Complex calculations (like scoring)

**Example** (future):
```javascript
// controllers/authController.js
function register(req, res) {
  // Hash password
  // Save user to database
  // Send response
}
```

---

### 📁 `/models`
**Purpose**: Database model definitions (to be implemented)

**What will go here**:
- Functions that interact directly with the database
- Reusable query functions

**Example** (future):
```javascript
// models/User.js
async function createUser(userData) {
  // Insert user into database
}
```

---

### 📁 `/middleware`
**Purpose**: Custom middleware functions

**Files**:
- `auth.js` - Authentication middleware
  - `verifyToken()` - Verify JWT tokens
  - `authorizeRole()` - Check user permissions

**How it works**:
- Middleware functions run before route handlers
- Used to protect routes and verify authentication

**Example usage**:
```javascript
router.get('/admin/users', verifyToken, authorizeRole('admin'), (req, res) => {
  // Only admins can access this
});
```

---

### 📁 `/utils`
**Purpose**: Utility functions used throughout the app

**Files**:
- `scoring.js` - Scoring algorithm for matching students to offers
  - `calculateMatchScore()` - Calculate overall score
  - `calculateSkillsScore()` - Calculate skills match (50% weight)
  - `calculateDiplomaScore()` - Calculate diploma match (30% weight)
  - `calculateLocationScore()` - Calculate location match (20% weight)
  - `isAutoGrantThreshold()` - Check if score meets auto-grant threshold (0.8)

**Scoring System Explained**:
```
Total Score = (Skills Score × 0.5) + (Diploma Score × 0.3) + (Location Score × 0.2)

- Skills Score: Percentage of required skills the student has
- Diploma Score: 1 if student's diploma meets requirement, 0 otherwise
- Location Score: 1 if student's location matches, 0 otherwise

Example:
- Student has 80% of required skills (0.8 × 0.5 = 0.4)
- Student's diploma matches (1 × 0.3 = 0.3)
- Student's location matches (1 × 0.2 = 0.2)
- Total Score = 0.4 + 0.3 + 0.2 = 0.9 ✓ (Auto-grant at 0.8+)
```

---

### 📁 `/public`
**Purpose**: Static files and React frontend

**What will go here**:
- React components (in Phase 6)
- CSS files
- Images
- JavaScript bundles

---

## Root Files

### `server.js`
The main entry point of the application.

**What it does**:
1. Loads environment variables from `.env`
2. Creates Express app
3. Sets up middleware (CORS, body parser)
4. Imports and mounts all routes
5. Handles errors
6. Starts server on specified port

**Key sections**:
- Middleware setup
- Route imports
- Error handling
- Server startup

---

### `package.json`
Defines project metadata and dependencies.

**Key fields**:
- `name`: Project name
- `version`: Current version
- `main`: Entry file (server.js)
- `scripts`: Commands to run
  - `npm start` - Run production server
  - `npm run dev` - Run with nodemon (auto-restart on file changes)
- `dependencies`: Required packages
- `devDependencies`: Development-only packages

---

### `.env.example`
Template for environment variables.

**How to use**:
1. Copy this file and rename to `.env`
2. Fill in your actual values
3. Never commit `.env` to version control (see `.gitignore`)

**Required variables**:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default 5000)
- `DB_HOST` - MySQL server address
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens

---

### `.gitignore`
Files to exclude from version control.

**Ignored files**:
- `node_modules/` - Installed packages (can be reinstalled with `npm install`)
- `.env` - Contains sensitive information
- `*.log` - Log files
- `.vscode/` - VS Code settings

---

### `README.md`
Project documentation and setup instructions.

---

## Development Workflow

### Phase 1: Project Initialization ✓ (CURRENT)
- [x] Create folder structure
- [x] Initialize dependencies
- [x] Setup database config
- [x] Create route templates
- [x] Create scoring algorithm skeleton

### Phase 2: Database Setup (NEXT)
**What we'll do**:
1. Create MySQL database
2. Execute SQL queries to create tables
3. Test database connection

**Files involved**: `config/database.js`, `database/schema.sql`

### Phase 3: Authentication System
**What we'll do**:
1. Implement user registration
2. Implement user login
3. Setup JWT token generation and verification
4. Implement password hashing with bcrypt

**Files involved**: `controllers/authController.js`, `models/User.js`, `routes/auth.js`

### Phase 4: Core API Endpoints
**What we'll do**:
1. Implement enterprise endpoints (create, read, update, delete offers)
2. Implement student endpoints (browse, apply for offers)
3. Implement admin endpoints (manage platform)

**Files involved**: Controllers, models, routes

### Phase 5: Scoring & Matching Algorithm
**What we'll do**:
1. Complete scoring algorithm (already started in `utils/scoring.js`)
2. Implement auto-grant logic when score ≥ 0.8
3. Implement auto-selection when offer expires
4. Send notifications on grant/selection

**Files involved**: `utils/scoring.js`, Controllers

### Phase 6: React Frontend
**What we'll do**:
1. Create React app in `/public` or separate folder
2. Build enterprise dashboard
3. Build student dashboard
4. Build admin dashboard

---

## Key Concepts Explained

### JWT (JSON Web Tokens)
Used for authentication. When a user logs in:
1. Server creates a token containing user info
2. Client stores this token
3. For each request, client sends token in Authorization header
4. Server verifies token to confirm user identity

### Middleware
Functions that run before route handlers. Used for:
- Authentication verification
- Request validation
- Data processing

### Database Connection Pool
Instead of creating a new database connection for each request:
1. Pool maintains multiple reusable connections
2. Requests use available connections
3. Connections are returned to pool after use
4. Much more efficient than creating connections repeatedly

### Score Calculation Example
```
Offer requires: JavaScript, React, Bachelor degree, Location: Paris

Student applies with: JavaScript, Vue, Bachelor degree, Location: Paris

Skills: "JavaScript" is in requirements but "Vue" is not
  → 1 skill out of 2 required = 0.5 (50%)
  → Skills Score = 0.5 × 0.5 weight = 0.25

Diploma: Bachelor matches Bachelor
  → Diploma Score = 1 × 0.3 weight = 0.3

Location: Paris matches Paris
  → Location Score = 1 × 0.2 weight = 0.2

Total Score = 0.25 + 0.3 + 0.2 = 0.75

Result: Application submitted with score 0.75 (below 0.8 threshold)
```

---

## Dependencies Explained

- **express**: Web framework for creating API
- **mysql2**: MySQL database driver with promise support
- **cors**: Allows requests from different domains
- **dotenv**: Loads environment variables from `.env`
- **body-parser**: Parses request bodies
- **bcryptjs**: Securely hash passwords
- **jsonwebtoken**: Create and verify JWT tokens
- **multer**: Handle file uploads (for CVs, etc.)
- **nodemon**: Auto-restart server during development

---

## Next Steps

1. **Database Setup** (Phase 2):
   - Open PHPMyAdmin
   - Create `hybrid_internship` database
   - Execute SQL queries from `database/schema.sql`
   - Test connection

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** from `.env.example`

4. **Start development server**:
   ```bash
   npm run dev
   ```

Once complete, we'll move to building the authentication system.

---

This structure is designed for clarity and easy maintenance. Each folder has a specific purpose, and the separation makes it easy to understand and extend the application.
