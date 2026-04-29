# Updated Database Schema & Scoring System

## Overview

The database schema has been completely redesigned to support **per-offer custom scoring**. Instead of hardcoded scoring rules, each offer stores its exact requirements, and each application stores the exact choices and scores.

---

## Database Tables (13 Total)

### Core User Tables

#### 1. `users`
Stores all users in the system.

```
users
├─ id (PK)
├─ email (UNIQUE)
├─ password_hash (bcrypted)
├─ full_name
├─ user_type (enum: enterprise, student, admin)
├─ phone
├─ is_active
└─ timestamps (created_at, updated_at)
```

#### 2. `enterprise_profiles`
Extended information for enterprise users.

```
enterprise_profiles
├─ id (PK)
├─ user_id (FK to users, UNIQUE)
├─ company_name
├─ company_location
├─ company_description
├─ company_website
├─ contact_person info (name, email, phone)
└─ timestamps
```

#### 3. `student_profiles`
Extended information for student users. **Changed to include location data.**

```
student_profiles
├─ id (PK)
├─ user_id (FK to users, UNIQUE)
├─ diploma_level (enum: high_school, 2nd_year, bachelor, master)
├─ field_of_study
├─ university_name
├─ graduation_year
├─ city (NEW - for location scoring)
├─ country (NEW)
├─ latitude (NEW - optional, for real distance calc)
├─ longitude (NEW - optional, for real distance calc)
├─ cv_url
└─ timestamps
```

#### 4. `student_skills`
Skills that each student possesses (profile-level).

```
student_skills
├─ id (PK)
├─ student_id (FK)
├─ skill_name
└─ timestamps
```

---

### Offer Tables

#### 5. `internship_offers`
Main internship offer. **Location moved to separate table.**

```
internship_offers
├─ id (PK)
├─ enterprise_id (FK)
├─ title
├─ description
├─ required_diploma (enum: high_school, 2nd_year, bachelor, master)
├─ duration_weeks
├─ salary_per_month
├─ status (enum: open, closed, filled)
├─ application_deadline
├─ start_date
└─ timestamps
```

#### 6. `offer_skills_detailed` (NEW)
Skills required for each offer **WITH WEIGHTS**.

```
offer_skills_detailed
├─ id (PK)
├─ offer_id (FK)
├─ skill_name
├─ skill_weight (decimal 0.00-1.00)
└─ timestamps

Example:
┌────────────────┬──────────────────┐
│ skill_name     │ skill_weight     │
├────────────────┼──────────────────┤
│ JavaScript     │ 0.50             │
│ React          │ 0.30             │
│ Node.js        │ 0.20             │
└────────────────┴──────────────────┘
Total: 1.0 (enterprise must manage this)
```

#### 7. `offer_location` (NEW)
Location requirement for each offer.

```
offer_location
├─ id (PK)
├─ offer_id (FK, UNIQUE - one location per offer)
├─ city
├─ country
├─ latitude (optional)
├─ longitude (optional)
└─ timestamps

Note: Storing city name. Distance calculation happens in backend
using hardcoded ranges, not real geolocation.
```

---

### Application Tables

#### 8. `applications` (REDESIGNED)
Main application record. **Now stores score breakdown instead of match_score.**

```
applications
├─ id (PK)
├─ student_id (FK)
├─ offer_id (FK)
├─ status (enum: pending, accepted, rejected, auto_selected)
├─ skills_score (0.00-1.00) - before weighting
├─ diploma_score (0.00-1.00) - before weighting
├─ location_score (0.00-1.00) - before weighting
├─ total_score (0.00-1.00) - final: (skills×0.4)+(diploma×0.4)+(location×0.2)
├─ accepted_at (timestamp, nullable)
└─ created_at, updated_at

UNIQUE constraint: (student_id, offer_id) - one application per student per offer
```

#### 9. `application_selected_skills` (NEW)
Stores exactly which skills the student selected and the weights at time of application.

```
application_selected_skills
├─ id (PK)
├─ application_id (FK)
├─ skill_name
├─ skill_weight_at_time (0.00-1.00) - for auditing
├─ score_received (0.00-1.00) - their contribution
└─ timestamps

Example for application where student checked JavaScript and React:
┌──────────────┬─────────────────┬──────────────────┐
│ skill_name   │ weight_at_time  │ score_received   │
├──────────────┼─────────────────┼──────────────────┤
│ JavaScript   │ 0.50            │ 0.50             │
│ React        │ 0.30            │ 0.30             │
└──────────────┴─────────────────┴──────────────────┘
Total skills_score = 0.50 + 0.30 = 0.80 (capped at 1.0)
```

#### 10. `application_diploma` (NEW)
Stores the diploma choice and score.

```
application_diploma
├─ id (PK)
├─ application_id (FK, UNIQUE)
├─ diploma_chosen (enum: high_school, 2nd_year, bachelor, master)
├─ required_diploma (enum: high_school, 2nd_year, bachelor, master)
├─ score_received (0.1, 0.3, 0.7, or 1.0)
└─ timestamps

Scoring Logic:
- Hierarchy: high_school(1) < 2nd_year(2) < bachelor(3) < master(4)
- If chosen >= required: score = 1.0
- If chosen < required:
  - Difference 1: score = 0.7
  - Difference 2: score = 0.3
  - Difference 3: score = 0.1
```

#### 11. `application_location` (NEW)
Stores location choice and distance-based score.

```
application_location
├─ id (PK)
├─ application_id (FK, UNIQUE)
├─ city_entered
├─ required_city
├─ distance_km (nullable, for audit)
├─ score_received (0.1, 0.3, 0.5, 0.7, or 1.0)
└─ timestamps

Distance Scoring (Hardcoded):
- Exact match: 1.0
- 0-50km: 0.7
- 50-100km: 0.5
- 100-200km: 0.3
- 200km+: 0.1
```

---

### System Tables

#### 12. `notifications`
Notifications for users. **New notification type added.**

```
notifications
├─ id (PK)
├─ user_id (FK)
├─ type (enum: offer_granted, application_rejected, offer_deadline, 
│         new_offer, auto_selected) [NEW: auto_selected]
├─ title
├─ message
├─ is_read
├─ related_offer_id (FK, nullable)
├─ related_application_id (FK, nullable)
└─ timestamps
```

#### 13. `admin_logs`
Audit trail for admin actions.

```
admin_logs
├─ id (PK)
├─ admin_id (FK)
├─ action_type
├─ description
├─ target_table
├─ target_id
└─ created_at
```

---

## Scoring System (40-40-20 Split)

### Formula
```
total_score = (skills_score × 0.4) + (diploma_score × 0.4) + (location_score × 0.2)
```

### 1. Skills Scoring (40% weight)

**Enterprise Side (Posting Offer):**
- Posts list of skills with weights
- Example: JavaScript (0.5), React (0.3), Node.js (0.2) = 1.0 total
- If total > 1.0, backend caps at 1.0
- Frontend will warn enterprise about this

**Student Side (Applying):**
- Sees checkboxes for each skill
- Example:
  - ☑ JavaScript
  - ☑ React
  - ☐ Node.js
- Score calculation: 0.5 + 0.3 = 0.8 (capped at 1.0)
- Contribution to final score: 0.8 × 0.4 = 0.32 (32%)

**Stored in DB:**
- `application_selected_skills` records each checked skill with its weight
- `applications.skills_score` stores the summed score (0.8)

---

### 2. Diploma Scoring (40% weight)

**Hierarchy:**
```
high_school (1) < 2nd_year (2) < bachelor (3) < master (4)
```

**Scoring Rules:**
```
If student diploma >= required diploma:
  score = 1.0 (full score)

If student diploma < required diploma:
  difference = required - student
  
  if difference == 1: score = 0.7 (e.g., Bachelor vs Master)
  if difference == 2: score = 0.3 (e.g., 2nd year vs Master)
  if difference == 3: score = 0.1 (e.g., High School vs Master)
```

**Examples:**
```
Offer requires: Bachelor
Student has: Master     → score = 1.0 (student over-qualified)
Student has: Bachelor  → score = 1.0 (exact match)
Student has: 2nd year  → score = 0.7 (1 level below)
Student has: High School → score = 0.3 (2 levels below)

Offer requires: Master
Student has: Bachelor  → score = 0.7 (1 level below)
```

**Contribution to final score:**
- Score 1.0: 1.0 × 0.4 = 0.40 (40%)
- Score 0.7: 0.7 × 0.4 = 0.28 (28%)
- Score 0.3: 0.3 × 0.4 = 0.12 (12%)

**Stored in DB:**
- `application_diploma` stores choice, required diploma, and score
- `applications.diploma_score` stores the score (0.1, 0.3, 0.7, or 1.0)

---

### 3. Location Scoring (20% weight)

**Enterprise Posting:**
- Enters city name (Paris, London, etc.)
- Stored in `offer_location.city`

**Student Applying:**
- Selects from radio buttons with distance categories
- Example options for Paris offer:
  - ◯ I live in Paris (1.0)
  - ◯ I live 0-50km from Paris (0.7)
  - ◯ I live 50-100km from Paris (0.5)
  - ◯ I live 100-200km from Paris (0.3)
  - ◯ I live 200km+ from Paris (0.1)

**Distance Scoring (Hardcoded):**
```
Exact city match: 1.0
0-50km:          0.7
50-100km:        0.5
100-200km:       0.3
200km+:          0.1
```

**Contribution to final score:**
- Score 1.0: 1.0 × 0.2 = 0.20 (20%)
- Score 0.7: 0.7 × 0.2 = 0.14 (14%)
- Score 0.5: 0.5 × 0.2 = 0.10 (10%)

**Stored in DB:**
- `application_location` stores city, distance, and score
- `applications.location_score` stores the score (0.1, 0.3, 0.5, 0.7, or 1.0)

---

## Full Scoring Example

### Scenario
**Offer:** JavaScript Developer at Google Paris
- Required skills: JavaScript (0.5), React (0.3), Node.js (0.2)
- Required diploma: Bachelor
- Location: Paris

**Student:** Alice
- Skills: JavaScript, React, Python
- Diploma: Bachelor
- Location: Lyon (approx 470km from Paris)

### Score Calculation

**Skills:**
- Checked: JavaScript (0.5), React (0.3)
- Not checked: Node.js
- Score: 0.5 + 0.3 = 0.8 ✓
- Contribution: 0.8 × 0.4 = 0.32

**Diploma:**
- Student: Bachelor (3)
- Required: Bachelor (3)
- Difference: 0 (exact match)
- Score: 1.0 ✓
- Contribution: 1.0 × 0.4 = 0.40

**Location:**
- Student: Lyon
- Required: Paris
- Distance: ~470km (200km+)
- Score: 0.1 ✓
- Contribution: 0.1 × 0.2 = 0.02

**Total Score:**
```
0.32 + 0.40 + 0.02 = 0.74

NOT auto-granted (< 0.8 threshold)
Goes into queue, ranked by score
```

### Database Records Created

**applications:**
```
id: 1
student_id: 5
offer_id: 12
status: pending
skills_score: 0.80
diploma_score: 1.00
location_score: 0.10
total_score: 0.74
```

**application_selected_skills:**
```
id 1: skill_name=JavaScript, weight=0.5, score_received=0.5
id 2: skill_name=React, weight=0.3, score_received=0.3
```

**application_diploma:**
```
id: 1
diploma_chosen: bachelor
required_diploma: bachelor
score_received: 1.0
```

**application_location:**
```
id: 1
city_entered: Lyon
required_city: Paris
distance_km: 470
score_received: 0.1
```

---

## Auto-Grant System

**Threshold:** 0.8 (80%)

When student applies:
1. Score calculated
2. If `total_score >= 0.8`:
   - Application status → `accepted`
   - Notification sent to student: "Congratulations!"
   - Notification sent to enterprise: "Offer accepted by [Student Name]"
   - Offer status may change to `filled`
3. If `total_score < 0.8`:
   - Application status → `pending`
   - Application enters queue
   - Highest-scored students ranked by `total_score` DESC

---

## Auto-Selection (When Offer Expires)

**When offer deadline reached:**
1. Check all `pending` applications for this offer
2. If any have `total_score >= 0.8`:
   - Highest-scoring one gets accepted automatically
   - Others get `rejected` with notification
3. If none have `total_score >= 0.8`:
   - Highest-scoring application gets `auto_selected` status
   - Others get `rejected` with notification
   - Both student and enterprise notified

---

## Key Differences from Original Schema

| Aspect | Old | New |
|--------|-----|-----|
| Skills | Generic list | List with individual weights per offer |
| Diploma | 4 levels (bachelor, master, phd, hs) | 4 levels + hierarchy system |
| Location | City name only | City + hardcoded distance ranges |
| Scoring | Hardcoded 50-30-20 | Flexible 40-40-20 + custom per-offer weights |
| Application Storage | Only match_score | Score breakdown + detailed choices |
| Auditing | No audit trail | Full choice/score history in DB |

---

## Database Relationships (ERD)

```
users
├─ enterprise_profiles (1:1)
│  └─ internship_offers (1:N)
│     ├─ offer_skills_detailed (1:N)
│     ├─ offer_location (1:1)
│     └─ applications (1:N)
│        ├─ application_selected_skills (1:N)
│        ├─ application_diploma (1:1)
│        └─ application_location (1:1)
│
├─ student_profiles (1:1)
│  ├─ student_skills (1:N)
│  └─ applications (1:N)
│
└─ notifications (1:N)
```

---

## Next Phase Preparation

With this schema in place, Phase 2 (Database Setup) will:

1. Create all 13 tables in MySQL
2. Set up relationships and constraints
3. Create indexes for performance
4. Test data integrity

Then Phase 4+ will implement controllers to:
- Store enterprise offers with skill weights
- Generate student-facing forms based on offer requirements
- Calculate scores using exact logic defined here
- Store all choices and scores for auditing

---

**Status:** Schema redesigned and ready for Phase 2 database creation ✅
