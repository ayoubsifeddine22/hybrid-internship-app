/**
 * Database Schema - SQL Migration File
 * 
 * This file contains all the SQL queries to create the database tables.
 * Execute these queries in PHPMyAdmin after creating the database.
 * 
 * Steps:
 * 1. Create database: hybrid_internship
 * 2. Select the database in PHPMyAdmin
 * 3. Copy and paste each SQL query below and execute
 * 
 * Tables to be created:
 * 1. users - Store all users (enterprises, students, admins)
 * 2. enterprise_profiles - Extended info for enterprises
 * 3. student_profiles - Extended info for students
 * 4. student_skills - Skills each student has
 * 5. internship_offers - Internship offers posted by enterprises
 * 6. offer_skills_detailed - Skills required per offer with weights
 * 7. applications - Student applications for offers
 * 8. application_selected_skills - Skills student selected with scoring
 * 9. application_diploma - Diploma choice with scoring
 * 10. application_location - Location choice with scoring
 * 11. notifications - Notifications for users
 * 12. admin_logs - Audit trail for admin actions
 */

-- =====================================================
-- TABLE 1: USERS
-- =====================================================
-- Stores information for all three user types:
-- - enterprise: Company posting internships
-- - student: Student applying for internships
-- - admin: Administrator managing the platform

/*
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Basic Information
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  
  -- User Type (enterprise, student, admin)
  user_type ENUM('enterprise', 'student', 'admin') NOT NULL,
  
  -- Contact
  phone VARCHAR(20),
  
  -- User Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_user_type (user_type)
);
*/

-- =====================================================
-- TABLE 2: ENTERPRISE PROFILE
-- =====================================================
-- Extended information for enterprise users

/*
CREATE TABLE enterprise_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  company_location VARCHAR(255) NOT NULL,
  company_description TEXT,
  company_website VARCHAR(255),
  
  -- Contact Person
  contact_person_name VARCHAR(255),
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_company_location (company_location)
);
*/

-- =====================================================
-- TABLE 3: STUDENT PROFILE
-- =====================================================
-- Extended information for student users

/*
CREATE TABLE student_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  
  -- Education
  diploma_level ENUM('high_school', '2nd_year', 'bachelor', 'master') NOT NULL,
  field_of_study VARCHAR(255),
  university_name VARCHAR(255),
  graduation_year INT,
  
  -- Location
  city VARCHAR(255),
  country VARCHAR(255),
  
  -- Other Info
  cv_url VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_diploma_level (diploma_level),
  INDEX idx_city (city)
);
*/

-- =====================================================
-- TABLE 4: STUDENT SKILLS
-- =====================================================
-- Skills that a student possesses

/*
CREATE TABLE student_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  UNIQUE KEY unique_student_skill (student_id, skill_name)
);
*/

-- =====================================================
-- TABLE 5: INTERNSHIP OFFERS
-- =====================================================
-- Internship offers posted by enterprises
-- Location comes from the enterprise_profiles table via enterprise_id

/*
CREATE TABLE internship_offers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enterprise_id INT NOT NULL,
  
  -- Offer Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Requirements
  required_diploma ENUM('high_school', '2nd_year', 'bachelor', 'master') NOT NULL,
  duration_weeks INT,
  salary_per_month DECIMAL(10, 2),
  
  -- Offer Status
  status ENUM('open', 'closed', 'filled') DEFAULT 'open',
  
  -- Winner tracking
  selected_student_id INT,  -- Student who won the offer (NULL until filled)
  selected_application_id INT,  -- The winning application ID
  
  -- Deadlines
  application_deadline DATE NOT NULL,
  start_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  filled_at TIMESTAMP NULL,  -- When offer was filled
  
  FOREIGN KEY (enterprise_id) REFERENCES enterprise_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_student_id) REFERENCES student_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (selected_application_id) REFERENCES applications(id) ON DELETE SET NULL,
  INDEX idx_enterprise_id (enterprise_id),
  INDEX idx_status (status),
  INDEX idx_application_deadline (application_deadline),
  INDEX idx_selected_student_id (selected_student_id)
);
*/

-- =====================================================
-- TABLE 6: OFFER SKILLS DETAILED
-- =====================================================
-- Skills required for each offer WITH WEIGHTS
-- Enterprise sets weights for each skill
-- Students will see these as checkboxes
-- Weight system: Enterprise sets weights, they're capped at 1.0 total
-- If total > 1.0, they're normalized to 1.0

/*
CREATE TABLE offer_skills_detailed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offer_id INT NOT NULL,
  
  -- Skill Information
  skill_name VARCHAR(255) NOT NULL,
  skill_weight DECIMAL(3, 2) NOT NULL,  -- e.g., 0.5, 0.3, 0.2
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (offer_id) REFERENCES internship_offers(id) ON DELETE CASCADE,
  INDEX idx_offer_id (offer_id),
  UNIQUE KEY unique_offer_skill (offer_id, skill_name)
);
*/

-- =====================================================
-- TABLE 7: APPLICATIONS
-- =====================================================
-- Student applications for internship offers
-- Stores overall score and status

/*
CREATE TABLE applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  offer_id INT NOT NULL,
  
  -- Application Data
  status ENUM('pending', 'accepted', 'rejected', 'auto_selected') DEFAULT 'pending',
  
  -- Score Breakdown (40% skills + 40% diploma + 20% location = 100%)
  skills_score DECIMAL(3, 2),           -- 0-1, multiplied by 0.4 for total
  diploma_score DECIMAL(3, 2),          -- 0-1, multiplied by 0.4 for total
  location_score DECIMAL(3, 2),         -- 0-1, multiplied by 0.2 for total
  total_score DECIMAL(3, 2),            -- Final combined score
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES internship_offers(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_offer_id (offer_id),
  INDEX idx_status (status),
  INDEX idx_total_score (total_score),
  UNIQUE KEY unique_application (student_id, offer_id)
);
*/

-- =====================================================
-- TABLE 8: APPLICATION SELECTED SKILLS
-- =====================================================
-- Student's selected skills for this application
-- Stores which skills they selected and the score they got
-- Used for auditing and recalculation if needed

/*
CREATE TABLE application_selected_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  
  -- Skill Information
  skill_name VARCHAR(255) NOT NULL,
  skill_weight_at_time DECIMAL(3, 2) NOT NULL,  -- Weight at time of application
  score_received DECIMAL(3, 2) NOT NULL,        -- What they got for this skill (capped at 1.0)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX idx_application_id (application_id)
);
*/

-- =====================================================
-- TABLE 9: APPLICATION DIPLOMA
-- =====================================================
-- Student's diploma choice for this application
-- Stores diploma selected and score received based on comparison

/*
CREATE TABLE application_diploma (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL UNIQUE,
  
  -- Diploma Information
  diploma_chosen ENUM('high_school', '2nd_year', 'bachelor', 'master') NOT NULL,
  required_diploma ENUM('high_school', '2nd_year', 'bachelor', 'master') NOT NULL,
  
  -- Scoring Logic:
  -- If diploma_chosen >= required_diploma: score = 1.0 (full score)
  -- If diploma_chosen < required_diploma:
  --   difference of 1 level = 0.7
  --   difference of 2 levels = 0.3
  --   difference of 3 levels = 0.1
  score_received DECIMAL(3, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX idx_application_id (application_id)
);
*/

-- =====================================================
-- TABLE 10: APPLICATION LOCATION
-- =====================================================
-- Student's location choice for this application
-- Stores city entered and distance-based score

/*
CREATE TABLE application_location (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL UNIQUE,
  
  -- Location Information
  enterprise_city VARCHAR(255) NOT NULL,  -- City shown to student from enterprise profile
  student_selected_range ENUM('exact', '0_50km', '50_100km', '100_200km', '200km_plus') NOT NULL,
  
  -- Distance Scoring (hardcoded ranges):
  -- exact (same city): 1.0
  -- 0_50km: 0.7
  -- 50_100km: 0.5
  -- 100_200km: 0.3
  -- 200km_plus: 0.1
  score_received DECIMAL(3, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX idx_application_id (application_id)
);
*/

-- =====================================================
-- TABLE 11: NOTIFICATIONS
-- =====================================================
-- Notifications sent to users

/*
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  
  -- Notification Content
  type ENUM('offer_granted', 'application_rejected', 'offer_deadline', 'new_offer', 'auto_selected') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  related_offer_id INT,
  related_application_id INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_offer_id) REFERENCES internship_offers(id) ON DELETE SET NULL,
  FOREIGN KEY (related_application_id) REFERENCES applications(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
*/

-- =====================================================
-- TABLE 12: ADMIN LOGS
-- =====================================================
-- Log of admin actions for auditing

/*
CREATE TABLE admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  
  -- Action Details
  action_type VARCHAR(255) NOT NULL,
  description TEXT,
  target_table VARCHAR(100),
  target_id INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);
*/

-- =====================================================
-- SCORING SYSTEM EXPLANATION
-- =====================================================
-- Total Score = (skills_score × 0.4) + (diploma_score × 0.4) + (location_score × 0.2)
--
-- SKILLS (40% weight):
--   - Enterprise posts skills with weights (e.g., JavaScript: 0.5, React: 0.3, Node: 0.2)
--   - If total weights > 1.0, they're capped at 1.0
--   - Student checks skills they have
--   - Score = sum of weights for checked skills, capped at 1.0
--   - Then multiplied by 0.4 for final contribution
--
-- DIPLOMA (40% weight):
--   - Diploma hierarchy: high_school (1) < 2nd_year (2) < bachelor (3) < master (4)
--   - If student diploma >= required: score = 1.0
--   - If student diploma < required:
--     - Difference of 1 level: score = 0.7
--     - Difference of 2 levels: score = 0.3
--     - Difference of 3 levels: score = 0.1
--   - Then multiplied by 0.4 for final contribution
--
-- LOCATION (20% weight):
--   - Exact city match: score = 1.0
--   - 0-50km away: score = 0.7
--   - 50-100km away: score = 0.5
--   - 100-200km away: score = 0.3
--   - 200km+ away: score = 0.1
--   - Then multiplied by 0.2 for final contribution
--
-- AUTO-GRANT THRESHOLD:
--   - If total_score >= 0.8: Application automatically accepted
--   - Otherwise: Enters queue, highest score wins when deadline expires
