# Hybrid Internship App

A comprehensive full-stack web application for managing internship offers, applications, and user profiles across three user roles: Students, Enterprises, and Administrators.

## Features

### Student Portal
- Browse and search internship offers
- Apply for internship positions
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

### Key Features
- Role-based access control (RBAC)
- Scoring system for applications
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
    ├── middleware/           # Express middleware
    ├── config/               # Configuration files
    └── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL database

### Backend Setup

```bash
cd backend
npm install
# Configure .env file with database credentials
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile

### Students
- `GET /student/offers` - Browse offers
- `POST /student/apply` - Apply to offer
- `GET /student/applications` - View applications
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

## User Roles

### Student
- Browse and apply for internships
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

## Database Schema

### Main Tables
- `users` - User accounts and authentication
- `student_profiles` - Student information
- `enterprise_profiles` - Enterprise information
- `internship_offers` - Posted internship positions
- `applications` - Internship applications
- `notifications` - User notifications
- `admin_logs` - System audit logs

## Scoring System

Applications are scored based on:
- Skills match (0-100)
- Diploma level match (0-100)
- Location preference (0-100)
- Total combined score

## Development

### Environment Variables

Backend `.env` file should include:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=internship_app
JWT_SECRET=your_secret_key
PORT=5000
```

### Running Development Server

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:5000`

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.
