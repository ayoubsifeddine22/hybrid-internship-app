# Scoring System: Old vs New Comparison

## Side-by-Side Comparison

### Weighting

| Aspect | Old | New |
|--------|-----|-----|
| Skills | 50% | 40% |
| Diploma | 30% | 40% |
| Location | 20% | 20% |
| **Total** | **100%** | **100%** |

---

### Skills Scoring

#### OLD SYSTEM:
```
Enterprise posts: ["JavaScript", "React", "Node.js"]
Student has: ["JavaScript", "React", "Python"]

Score = matched skills / total required
Score = 2/3 = 0.67
Contribution to final = 0.67 × 0.5 = 0.33 (33%)
```

#### NEW SYSTEM:
```
Enterprise posts:
  - JavaScript: 0.5 weight
  - React: 0.3 weight
  - Node.js: 0.2 weight

Student checks: JavaScript ✓, React ✓, Node.js ✗

Score = sum of weights for checked
Score = 0.5 + 0.3 = 0.8
Contribution to final = 0.8 × 0.4 = 0.32 (32%)
```

**Key Difference:**
- Old: Percentage matching
- New: Enterprise-defined weights, student sees checkboxes

---

### Diploma Scoring

#### OLD SYSTEM:
```
Hierarchy: high_school < bachelor < master < phd

If student diploma >= required: 1.0
Otherwise: 0.0

Example:
  Required: Bachelor
  Student has: Bachelor     → 1.0 ✓
  Student has: High School  → 0.0 ✗
  Student has: Master       → 1.0 ✓

Contribution to final = score × 0.3 (30%)
```

#### NEW SYSTEM:
```
Hierarchy: high_school(1) < 2nd_year(2) < bachelor(3) < master(4)

If student diploma >= required: 1.0
If student diploma < required:
  - 1 level below: 0.7
  - 2 levels below: 0.3
  - 3 levels below: 0.1

Example:
  Required: Bachelor(3)
  Student has: Master(4)        → 1.0 ✓ (exceeds requirement)
  Student has: Bachelor(3)      → 1.0 ✓ (exact match)
  Student has: 2nd_year(2)      → 0.7 (1 level below)
  Student has: High_school(1)   → 0.3 (2 levels below)

Contribution to final = score × 0.4 (40%)
```

**Key Difference:**
- Old: Binary (match or not)
- New: Hierarchical with partial credit for lower diplomas

---

### Location Scoring

#### OLD SYSTEM:
```
Enterprise posts: "Paris"
Student has: "Paris" or "Loire"

If cities match: 1.0
Otherwise: 0.0

Contribution to final = score × 0.2 (20%)
```

#### NEW SYSTEM:
```
Enterprise posts: "Paris"
Student selects from options:
  - I live in Paris              → 1.0 ✓ (exact city)
  - I live 0-50km from Paris     → 0.7
  - I live 50-100km from Paris   → 0.5
  - I live 100-200km from Paris  → 0.3
  - I live 200km+ from Paris     → 0.1

Contribution to final = score × 0.2 (20%)
```

**Key Difference:**
- Old: Binary match, no distance consideration
- New: Distance-based scoring with categories

---

## Score Calculation Examples

### Example 1: Perfect Match

**Offer:**
- Skills: JavaScript (0.4), React (0.4), TypeScript (0.2)
- Required Diploma: Bachelor
- Location: London

**Student (Alice):**
- Has skills: JavaScript ✓, React ✓, TypeScript ✗
- Diploma: Master
- Location: London

**OLD SYSTEM:**
```
Skills: 2/3 = 0.67 × 0.5 = 0.335
Diploma: Master >= Bachelor = 1.0 × 0.3 = 0.30
Location: London == London = 1.0 × 0.2 = 0.20
─────────────────────────────────
Total = 0.335 + 0.30 + 0.20 = 0.835
Status: AUTO-GRANTED ✓
```

**NEW SYSTEM:**
```
Skills: 0.4 + 0.4 = 0.8 × 0.4 = 0.32
Diploma: Master >= Bachelor = 1.0 × 0.4 = 0.40
Location: Exact match = 1.0 × 0.2 = 0.20
─────────────────────────────────
Total = 0.32 + 0.40 + 0.20 = 0.92
Status: AUTO-GRANTED ✓
```

---

### Example 2: Partial Match

**Offer:**
- Skills: Python (0.5), Django (0.3), Docker (0.2)
- Required Diploma: Bachelor
- Location: Paris

**Student (Bob):**
- Has skills: Python ✓, Django ✗, Docker ✗
- Diploma: 2nd Year
- Location: Lyon (470km away)

**OLD SYSTEM:**
```
Skills: 1/3 = 0.33 × 0.5 = 0.165
Diploma: 2nd Year < Bachelor = 0.0 × 0.3 = 0.00
Location: Lyon != Paris = 0.0 × 0.2 = 0.00
─────────────────────────────────
Total = 0.165 + 0.00 + 0.00 = 0.165
Status: REJECTED (very low score)
```

**NEW SYSTEM:**
```
Skills: 0.5 × 0.4 = 0.20
Diploma: 2nd_year(2) < bachelor(3) = 0.7 × 0.4 = 0.28
Location: 470km (200km+) = 0.1 × 0.2 = 0.02
─────────────────────────────────
Total = 0.20 + 0.28 + 0.02 = 0.50
Status: PENDING (may win with higher score)
```

**Key Insight:**
- Old system: 0% credit for lower diploma
- New system: 70% credit for 1 level below (more fair)

---

### Example 3: Close Call

**Offer:**
- Skills: Java (0.6), Spring (0.4)
- Required Diploma: Master
- Location: Berlin

**Student (Carol):**
- Has skills: Java ✓, Spring ✓
- Diploma: Bachelor
- Location: Munich (600km away)

**OLD SYSTEM:**
```
Skills: 2/2 = 1.0 × 0.5 = 0.50
Diploma: Bachelor < Master = 0.0 × 0.3 = 0.00
Location: Munich != Berlin = 0.0 × 0.2 = 0.00
─────────────────────────────────
Total = 0.50 + 0.00 + 0.00 = 0.50
Status: REJECTED (no diploma match)
```

**NEW SYSTEM:**
```
Skills: 0.6 + 0.4 = 1.0 × 0.4 = 0.40
Diploma: bachelor(3) < master(4) = 0.7 × 0.4 = 0.28
Location: 600km (200km+) = 0.1 × 0.2 = 0.02
─────────────────────────────────
Total = 0.40 + 0.28 + 0.02 = 0.70
Status: PENDING (not auto-granted, but reasonable score)
```

**Key Insight:**
- Old system: Punished heavily for lower diploma (automatic 0)
- New system: Gives 70% credit for 1 level below (more lenient)

---

## Database Schema Differences

### OLD SCHEMA:
```
9 Tables:
- users
- enterprise_profiles
- student_profiles
- student_skills
- internship_offers
- offer_required_skills (just skill names, no weights)
- applications (single match_score field)
- notifications
- admin_logs
```

### NEW SCHEMA:
```
13 Tables:
- users
- enterprise_profiles
- student_profiles
- student_skills
- internship_offers
- offer_skills_detailed (with weights)
- offer_location (separated)
- applications (score breakdown)
- application_selected_skills (audit trail)
- application_diploma (audit trail)
- application_location (audit trail)
- notifications
- admin_logs
```

**New Audit Trail:**
- Each skill choice recorded in application_selected_skills
- Each diploma choice recorded in application_diploma
- Each location choice recorded in application_location
- All with scores for transparency and debugging

---

## Frontend Impact

### OLD SYSTEM (For Reference):
```html
Skills:
<input type="checkbox" name="skills" value="JavaScript">
<input type="checkbox" name="skills" value="React">
<input type="checkbox" name="skills" value="Node.js">

Diploma:
<select name="diploma">
  <option>High School</option>
  <option>Bachelor</option>
  <option>Master</option>
  <option>PhD</option>
</select>

Location:
<input type="text" name="location" placeholder="City">
```

### NEW SYSTEM:
```html
Skills (dynamic based on offer):
<label><input type="checkbox" name="skills" value="JavaScript"> JavaScript</label>
<label><input type="checkbox" name="skills" value="React"> React</label>
<label><input type="checkbox" name="skills" value="Node.js"> Node.js</label>

Diploma:
<select name="diploma">
  <option>High School</option>
  <option>2nd Year</option>
  <option>Bachelor</option>
  <option>Master</option>
</select>

Location (dynamic based on offer location):
<label><input type="radio" name="location" value="exact">
  I live in Paris</label>
<label><input type="radio" name="location" value="0-50km">
  I live 0-50km from Paris</label>
<label><input type="radio" name="location" value="50-100km">
  I live 50-100km from Paris</label>
<label><input type="radio" name="location" value="100-200km">
  I live 100-200km from Paris</label>
<label><input type="radio" name="location" value="200+km">
  I live 200km+ from Paris</label>
```

---

## Auto-Grant Threshold

| System | Threshold | Why |
|--------|-----------|-----|
| Old | 0.8 (80%) | Balanced between being selective and finding matches |
| New | 0.8 (80%) | Same threshold, but now easier to reach due to diploma flexibility |

**Impact:**
- Old system: Harder to reach 0.8 due to all-or-nothing diploma scoring
- New system: Easier to reach 0.8 due to partial diploma credit

---

## When to Use This

### When Enterprise Posts:
1. Choose required diploma level (just one selection)
2. Enter skills + weights (0.0-1.0 each)
3. Enter city (just text input)
4. Backend validates and caps weights at 1.0

### When Student Applies:
1. Check skills they have (checkboxes)
2. Select their diploma level
3. Select distance category for location (radio buttons)
4. System calculates score automatically
5. If score >= 0.8, auto-grant
6. Otherwise, enter queue

---

## Key Improvements

✅ **Fairer for Students:** Partial credit for lower diplomas instead of all-or-nothing
✅ **More Flexible:** Enterprise can assign different weights to different skills
✅ **Better Auditing:** All choices stored for transparency
✅ **Clearer Scoring:** Breaking down score by component helps students understand
✅ **Distance-Aware:** Location scoring considers distance, not just exact match
✅ **More Realistic:** Student options match how real recruitment works

---

**Everything is ready! Proceed to Phase 2 when you're ready! 🚀**
