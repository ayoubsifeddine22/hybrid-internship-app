

function calculateMatchScore(applicationData, offerData) {
  const skillsScore = calculateSkillsScore(applicationData.selected_skills || applicationData.selectedSkills, offerData.offer_skills || offerData.skillOptions);
  const diplomaScore = calculateDiplomaScore(applicationData.diploma_level || applicationData.diplomaChosen, offerData.required_diploma || offerData.requiredDiploma);
  const locationScore = calculateLocationScore(applicationData.distance_range || applicationData.city, offerData.city);

  // Ensure no NaN values
  const s = isNaN(skillsScore) ? 0 : skillsScore;
  const d = isNaN(diplomaScore) ? 0 : diplomaScore;
  const l = isNaN(locationScore) ? 0.1 : locationScore;

  // Weighted calculation: 40% + 40% + 20% = 100%
  const totalScore = (s * 0.4) + (d * 0.4) + (l * 0.2);

  return {
    skills_score: Math.round(s * 100) / 100,
    diploma_score: Math.round(d * 100) / 100,
    location_score: Math.round(l * 100) / 100,
    total_score: Math.round(totalScore * 100) / 100
  };
}

function calculateSkillsScore(selectedSkills, skillOptions) {
  if (!selectedSkills || selectedSkills.length === 0) return 0;
  if (!skillOptions) return 0;

  let totalWeight = 0;

  // Convert object to array format if needed
  let skillsArray;
  if (Array.isArray(skillOptions)) {
    skillsArray = skillOptions;
  } else if (typeof skillOptions === 'object') {
    // Convert {skill_name: weight} to [{skill_name, skill_weight}]
    skillsArray = Object.entries(skillOptions).map(([name, weight]) => ({
      skill_name: name,
      skill_weight: parseFloat(weight) // Convert to number
    }));
  } else {
    return 0;
  }

  console.log('=== CALCULATE SKILLS SCORE ===');
  console.log('Selected skills:', selectedSkills);
  console.log('Skills array:', skillsArray);

  // Sum weights of selected skills
  selectedSkills.forEach(selectedSkill => {
    const skillOption = skillsArray.find(
      opt => opt.skill_name.toLowerCase() === selectedSkill.toLowerCase()
    );
    console.log(`Matching "${selectedSkill}":`, skillOption);
    if (skillOption) {
      const weight = parseFloat(skillOption.skill_weight); // Convert to number
      console.log(`Adding weight: ${weight} (type: ${typeof weight})`);
      totalWeight += weight;
    }
  });

  console.log('Total weight:', totalWeight);
  console.log('==============================');

  // Cap at 1.0 (if enterprise weights total > 1.0, we cap it)
  return Math.min(totalWeight, 1.0);
}

function calculateDiplomaScore(studentDiploma, requiredDiploma) {
  const diplomaHierarchy = {
    'high_school': 1,
    '2nd_year': 2,
    'bachelor': 3,
    'master': 4
  };

  const reverseHierarchy = {
    1: 'high_school',
    2: '2nd_year',
    3: 'bachelor',
    4: 'master'
  };

  // Convert to number if string
  let studentLevel;
  if (typeof studentDiploma === 'number') {
    studentLevel = studentDiploma;
  } else if (typeof studentDiploma === 'string') {
    studentLevel = diplomaHierarchy[studentDiploma] || 0;
  } else {
    studentLevel = 0;
  }

  // Convert to number if string
  let requiredLevel;
  if (typeof requiredDiploma === 'number') {
    requiredLevel = requiredDiploma;
  } else if (typeof requiredDiploma === 'string') {
    requiredLevel = diplomaHierarchy[requiredDiploma] || 0;
  } else {
    requiredLevel = 0;
  }

  // Student has equal or higher diploma
  if (studentLevel >= requiredLevel) {
    return 1.0;
  }

  // Student has lower diploma - calculate difference
  const difference = requiredLevel - studentLevel;

  if (difference === 1) {
    return 0.7;
  } else if (difference === 2) {
    return 0.3;
  } else if (difference === 3) {
    return 0.1;
  }

  // More than 3 levels difference
  return 0.0;
}

function calculateLocationScore(distanceRange) {
  if (!distanceRange) {
    // Default to lowest score if no distance range provided
    return 0.1;
  }

  const distanceScores = {
    'exact': 1.0,
    '0_50km': 0.7,
    '50_100km': 0.5,
    '100_200km': 0.3,
    '200km_plus': 0.1
  };

  return distanceScores[distanceRange] || 0.1;
}

function isAutoGrantThreshold(score, threshold = 0.8) {
  return score >= threshold;
}

module.exports = {
  calculateMatchScore,
  calculateSkillsScore,
  calculateDiplomaScore,
  calculateLocationScore,
  isAutoGrantThreshold
};

