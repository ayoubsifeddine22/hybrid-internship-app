# Hybrid Internship App

A comprehensive full-stack web application for managing internship offers, applications, and user profiles across three user roles: Students, Enterprises, and Administrators.

## Features

### Student Portal
- Browse and search internship offers
- Apply for internship positions with a manual form or by uploading a CV
- Track application status
- View detailed offer information
- Manage personal profile
- Receive notifications about applications and offers

### Enterprise Portal
- Post internship offers
- Manage applications received
- View applicant profiles and scores
- Track offer statistics
- Manage company profile
- View application analytics

### Admin Dashboard
- Manage all users (Students, Enterprises, Admins)
- Monitor all offers and applications
- View system logs and audit trail
- Access admin settings
- User status management
- System-wide statistics and analytics

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- CSS3 for styling
- JWT for authentication

### Backend
- Node.js with Express.js
- MySQL for database
- JWT authentication
- RESTful API architecture

### AI Integration
- OpenRouter API (free tier) for CV parsing
- pdf-parse for PDF text extraction
- Nominatim (OpenStreetMap) for city geocoding
- Haversine formula for real distance calculation between cities

### Key Features
- Role-based access control (RBAC)
- Scoring system for applications
- AI-powered CV parsing with automatic form pre-fill
- Real-time notifications
- Admin audit logs
- User authentication and authorization
- Responsive UI design

## Project Structure

```
hybrid-internship-app/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── styles/           # CSS stylesheets
│   └── package.json
└── backend/                  # Node.js/Express backend
    ├── controllers/          # Route controllers
    ├── routes/               # Express routes
    ├── middleware/            # Express middleware
    ├── config/               # Configuration files
    ├── utils/                # Utility functions (CV parser, normalizers, scoring)
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL database
- An OpenRouter account and API key (free) — sign up at https://openrouter.ai

---

### 1. Clone the repository

```bash
git clone https://github.com/SifeddineAyoub/hybrid-internship-app.git
cd hybrid-internship-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder and fill in your values:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_app
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
OPENROUTER_API_KEY=your_openrouter_api_key_here
HTTP_REFERER=http://localhost:3000
```

**Where to get the OpenRouter API key:**
1. Go to https://openrouter.ai and create a free account
2. Navigate to Keys in your dashboard
3. Click "Create Key" and copy the generated key
4. Paste it as the value of `OPENROUTER_API_KEY` in your `.env` file — no credits needed, the app only uses free models

Then start the backend:

```bash
npm start
```

The backend will run on `http://localhost:5000`

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

---

### 4. Database Setup

Make sure your MySQL server is running, then create the database:

```sql
CREATE DATABASE internship_app;
```

Import the schema if you have a `.sql` file:

```bash
mysql -u root -p internship_app < schema.sql
```

---

## AI CV Parsing Feature

When a student applies to an offer, they can choose between filling the form manually or uploading their CV as a PDF. Here's what happens when they upload a CV:

1. The PDF is sent to the backend where `pdf-parse` extracts the raw text
2. The text is sent to OpenRouter with a strict prompt — the model returns a JSON object containing the matched skills, diploma level, and the student's city
3. The student's city is geocoded using OpenStreetMap's Nominatim API, and the real distance to the offer location is calculated using the Haversine formula
4. The result pre-fills the application form — the student reviews and submits

The system uses a fallback chain of 6 free models on OpenRouter. If one is rate-limited or returns an invalid response, it automatically moves to the next one. No API costs are involved.

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile

### Students
- `GET /student/offers` - Browse offers
- `GET /student/offers/:id` - Get offer details
- `POST /student/applications` - Submit application
- `GET /student/applications` - View applications
- `POST /student/parse-cv` - Parse CV and extract application data
- `GET /student/profile` - Get student profile

### Enterprises
- `POST /enterprise/offer` - Create offer
- `GET /enterprise/offers` - View own offers
- `GET /enterprise/applications` - View applications
- `PUT /enterprise/profile` - Update profile

### Admin
- `GET /admin/users` - List all users
- `GET /admin/offers` - View all offers
- `GET /admin/applications` - View all applications
- `GET /admin/logs` - View audit logs

---

## User Roles

### Student
- Browse and apply for internships (manually or via CV upload)
- Track application status
- Manage profile

### Enterprise
- Post internship offers
- Review applications
- Manage company information

### Admin
- Full system access
- User management
- System monitoring
- Audit logging

---

## Database Schema

### Main Tables
- `users` - User accounts and authentication
- `student_profiles` - Student information
- `enterprise_profiles` - Enterprise information
- `internship_offers` - Posted internship positions
- `offer_skills_detailed` - Skills required per offer with weights
- `applications` - Internship applications
- `application_selected_skills` - Skills audit trail per application
- `application_diploma` - Diploma audit trail per application
- `application_location` - Location audit trail per application
- `notifications` - User notifications
- `admin_logs` - System audit logs

---

## Scoring System

Applications are scored based on three criteria:

- **Skills match** — which of the required skills the student has
- **Diploma level** — how the student's diploma compares to what the offer requires
- **Location** — distance between the student and the offer location

Each criterion produces a score. If the total score reaches 0.8 or above, the student is automatically accepted and the offer is closed. Otherwise the application stays pending and the highest-scoring student is selected at the deadline.

---

## Pushing Changes to GitHub

Once you've made changes and want to push them:

```bash
# Stage all changed files
git add .

# Commit with a message describing what you did
git commit -m "your commit message here"

# Push to the main branch
git push origin main
```

If your default branch is `master` instead of `main`, replace `main` with `master` in the push command.

---

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.