# Changes Made for Phase 2 - Summary

## Files Modified

### 1. `database/schema.sql`
**Complete redesign from 9 tables to 13 tables**

**New Tables Added:**
- `offer_skills_detailed` - Skills with weights per offer
- `offer_location` - Location details per offer (separated from main offer)
- `application_selected_skills` - Audit trail of which skills student selected
- `application_diploma` - Audit trail of diploma choice with score
- `application_location` - Audit trail of location choice with score

**Tables Modified:**
- `student_profiles` - Added city, country, latitude, longitude
- `internship_offers` - Removed location field (moved to offer_location)
- `applications` - Changed from single `match_score` to breakdown: skills_score, diploma_score, location_score, total_score

**Tables Removed:**
- `offer_required_skills` - Replaced by `offer_skills_detailed` with weights

**New Diploma Levels:**
- Changed from: high_school, bachelor, master, phd
- Changed to: high_school, 2nd_year, bachelor, master

---

### 2. `utils/scoring.js`
**Complete rewrite with new scoring logic**

**Key Changes:**

1. **Weights Updated:**
   - Old: Skills 50%, Diploma 30%, Location 20%
   - New: Skills 40%, Diploma 40%, Location 20%

2. **Skills Scoring:**
   - Old: Simple percentage (matched/total)
   - New: Sum of weights for selected skills, capped at 1.0
   - Students see checkboxes, check which skills they have

3. **Diploma Scoring:**
   - Old: Binary (match or not)
   - New: Hierarchical with levels:
     - Student diploma >= required: 1.0 (full score)
     - 1 level below: 0.7
     - 2 levels below: 0.3
     - 3 levels below: 0.1

4. **Location Scoring:**
   - Old: Binary (city match or not)
   - New: Distance-based ranges:
     - Exact city: 1.0
     - 0-50km: 0.7
     - 50-100km: 0.5
     - 100-200km: 0.3
     - 200km+: 0.1

5. **Return Value:**
   - Old: Single number (total_score)
   - New: Object with breakdown:
     ```javascript
     {
       skills_score: 0.80,
       diploma_score: 1.00,
       location_score: 0.10,
       total_score: 0.74
     }
     ```

6. **New Function Added:**
   - `getDistanceScore(distanceKm)` - Helper for distance-based scoring

---

## How It Works Now

### For Enterprises Posting an Offer:

1. **Skills:**
   - Enter skills list: "JavaScript", "React", "Node.js"
   - Set weights for each: 0.5, 0.3, 0.2
   - Backend validates total <= 1.0 (or caps at 1.0)
   - Frontend alerts if total weights > 1.0

2. **Diploma:**
   - Select required level: Bachelor
   - That's it (no more complex tiers needed)

3. **Location:**
   - Enter city: "Paris"
   - That's it (no lat/long needed)

### For Students Applying:

1. **Skills:**
   - See checkboxes for each skill
   - ☑ JavaScript
   - ☑ React
   - ☐ Node.js
   - Check which ones they have

2. **Diploma:**
   - Select their actual diploma level
   - ◯ High School
   - ◯ 2nd Year
   - ◯ Bachelor
   - ◯ Master

3. **Location:**
   - Select distance from the city
   - ◯ I live in Paris (exact city)
   - ◯ I live 0-50km away
   - ◯ I live 50-100km away
   - ◯ I live 100-200km away
   - ◯ I live 200km+ away

### Score Calculation:

```
Formula: (skills × 0.4) + (diploma × 0.4) + (location × 0.2)

Example:
- Skills: Student selected JavaScript (0.5) + React (0.3) = 0.8 score
  Contribution: 0.8 × 0.4 = 0.32

- Diploma: Student has Bachelor, required is Bachelor = 1.0 score
  Contribution: 1.0 × 0.4 = 0.40

- Location: Student in Lyon, offer in Paris = 470km away = 0.1 score
  Contribution: 0.1 × 0.2 = 0.02

Total: 0.32 + 0.40 + 0.02 = 0.74 (not auto-granted at 0.8)
```

---

## Database Impact

### New Complexity (But Cleaner Architecture):
- ✅ More tables (13 vs 9)
- ✅ More detailed auditing
- ✅ Easier to track scoring decisions
- ✅ Can recalculate scores if logic changes
- ✅ Enterprise has full control over skill weights

### Benefits:
- Per-offer customization
- Complete audit trail
- Flexible weighting system
- Clear scoring separation
- Easy to debug scores

---

## What Stays the Same

- Auto-grant threshold: 0.8 (80%)
- Database connection pooling: Unchanged
- Authentication system: Unchanged (will be Phase 3)
- Route structure: Unchanged
- All 3 user spaces: Unchanged

---

## What's Ready for Phase 2

✅ Completely updated schema.sql with all table definitions
✅ Updated scoring.js with new calculation logic
✅ Comprehensive database documentation
✅ All SQL queries ready to execute in PHPMyAdmin
✅ Complete audit trail system in place

---

## Next: Phase 2 Tasks

1. Copy schema.sql SQL queries into PHPMyAdmin
2. Create all 13 tables
3. Add some test data
4. Verify relationships and constraints
5. Test scoring algorithm with sample data

Then Phase 3 will implement:
- User registration/login
- Password hashing
- JWT tokens
- Admin functionality

---

## Quick Reference: New Diploma Hierarchy

```
Level 1: high_school
Level 2: 2nd_year (e.g., DUT, 2-year diploma)
Level 3: bachelor (4-year degree)
Level 4: master (graduate degree)

If required is Bachelor (3):
- Student has Master (4):        score = 1.0 ✓
- Student has Bachelor (3):      score = 1.0 ✓
- Student has 2nd Year (2):      score = 0.7 (1 level below)
- Student has High School (1):   score = 0.3 (2 levels below)
```

---

## New Distance Ranges

```
Exact city match:     1.0 (full score)
0-50 km:              0.7 (very close)
50-100 km:            0.5 (close)
100-200 km:           0.3 (far)
200+ km:              0.1 (very far)
```

---

**Everything is now set for Phase 2: Database Setup! 🎉**

You can now create these tables in PHPMyAdmin and we'll move to Phase 3: Authentication.
