# Hybrid Internship Application

A comprehensive web application for managing internship offers between enterprises and students with intelligent score-based matching system.

## Project Overview

This application allows:
- **Enterprises**: Post internship offers with required skills, diploma level, and location
- **Students**: Apply for internship offers by filling forms
- **Admin**: Manage platform, users, and offers
- **Automatic Matching**: Score-based ranking system (Skills: 50%, Diploma: 30%, Location: 20%)

## Features

### Scoring System
- Skills matching: 50% weight
- Diploma matching: 30% weight  
- Location matching: 20% weight
- Automatic offer grant when score ≥ 0.8
- Fallback: Auto-select highest-scoring student when offer expires

### Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: MySQL (via PHPMyAdmin)
- **Frontend**: React (to be integrated)
- **Authentication**: JWT

## Project Structure

```
hybrid-internship-app/
├── config/              # Configuration files
├── database/            # Database setup and migrations
├── routes/              # API endpoints
├── controllers/         # Business logic
├── models/              # Database models
├── middleware/          # Custom middleware
├── utils/               # Utility functions
├── public/              # Static files (when React frontend is added)
├── .env                 # Environment variables (create this locally)
├── .gitignore           # Git ignore rules
├── server.js            # Main server file
├── package.json         # Project dependencies
└── README.md            # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- PHPMyAdmin

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in the root directory:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hybrid_internship
JWT_SECRET=your_secret_key_here
```

### Step 3: Database Setup
- Open PHPMyAdmin
- Create a new database called `hybrid_internship`
- Run the SQL migration files (to be created in the next phase)

### Step 4: Start the Server
```bash
npm run dev
```
The server will run on `http://localhost:5000`

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Enterprise Space
- `GET /api/enterprise/offers` - View internship offers
- `POST /api/enterprise/offers` - Post new internship offer
- `PUT /api/enterprise/offers/:id` - Edit offer
- `DELETE /api/enterprise/offers/:id` - Delete offer
- `GET /api/enterprise/applications/:offerId` - View applications for an offer

### Student Space
- `GET /api/student/offers` - Browse available offers
- `POST /api/student/applications` - Apply for an offer
- `GET /api/student/applications` - View own applications
- `GET /api/student/applications/:id` - View application status

### Admin Space
- `GET /api/admin/users` - View all users
- `GET /api/admin/offers` - View all offers
- `GET /api/admin/statistics` - Platform statistics
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/offers/:id` - Delete offer

## Database Schema (Next Phase)

We will create tables for:
- users (enterprises, students, admins)
- internship_offers
- applications
- skills_requirements
- diploma_requirements

## Development Notes

This project is structured to be easily understood as we build it together. Each phase will be completed and explained thoroughly:

1. **Phase 1**: Project initialization ✓ (Current)
2. **Phase 2**: Database setup and schema creation
3. **Phase 3**: Authentication system
4. **Phase 4**: Core API endpoints
5. **Phase 5**: Scoring algorithm implementation
6. **Phase 6**: React frontend integration

## Running Tests
```bash
npm test
```

## Additional Resources
- Express.js: https://expressjs.com/
- MySQL2: https://github.com/sidorares/node-mysql2
- JWT: https://jwt.io/

---

For detailed implementation questions or issues, refer to the specific phase documentation.
