

// ======= SKILL MAPPING =======
// Normalize skill names to standard format
const SKILL_MAP = {
  'javascript': 'javascript',
  'js': 'javascript',
  'typescript': 'typescript',
  'ts': 'typescript',
  'react': 'react',
  'reactjs': 'react',
  'vue': 'vue',
  'vuejs': 'vue',
  'angular': 'angular',
  'angularjs': 'angular',
  'node': 'nodejs',
  'nodejs': 'nodejs',
  'node.js': 'nodejs',
  'python': 'python',
  'java': 'java',
  'csharp': 'csharp',
  'c#': 'csharp',
  'php': 'php',
  'ruby': 'ruby',
  'go': 'go',
  'golang': 'golang',
  'rust': 'rust',
  'sql': 'sql',
  'mysql': 'mysql',
  'mongodb': 'mongodb',
  'postgresql': 'postgresql',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'aws': 'aws',
  'git': 'git',
  'linux': 'linux',
  'html': 'html',
  'css': 'css',
  'rest': 'rest',
  'graphql': 'graphql',
  'api': 'api'
};

// ======= DIPLOMA MAPPING =======
// Normalize diploma names to levels
const DIPLOMA_MAP = {
  'high school': 1,
  'highschool': 1,
  'high_school': 1,
  'lycée': 1,
  'bac': 1,
  'baccalauréat': 1,
  '2nd year': 2,
  '2nd_year': 2,
  'dut': 2,
  'bts': 2,
  'associate': 2,
  'licence': 3,
  'bachelor': 3,
  'bsc': 3,
  'ba': 3,
  'master': 4,
  'msc': 4,
  'ma': 4,
  'phd': 4,
  'doctorate': 4
};

function normalizeSkills(skillsArray) {
  if (!Array.isArray(skillsArray)) {
    return [];
  }

  return skillsArray
    .map(skill => {
      if (!skill || typeof skill !== 'string') {
        return null;
      }
      const normalized = skill.toLowerCase().trim();
      return SKILL_MAP[normalized] || normalized; // Return mapped value or original if not in map
    })
    .filter(skill => skill !== null && skill !== undefined)
    .filter((skill, index, self) => self.indexOf(skill) === index); // Remove duplicates
}

function normalizeDiploma(diploma) {
  if (!diploma) {
    return null;
  }

  if (typeof diploma === 'number') {
    // If already a number, validate it's 1-4
    if (diploma >= 1 && diploma <= 4) {
      return diploma;
    }
    return null;
  }

  if (typeof diploma === 'string') {
    const normalized = diploma.toLowerCase().trim();
    return DIPLOMA_MAP[normalized] || null;
  }

  return null;
}

function normalizeDistance(locationData) {
  if (!locationData) {
    return null;
  }

  const { type, value, country, offerCountry } = locationData;

  const VALID_RANGES = ['exact', '0_50km', '50_100km', '100_200km', '200km_plus'];

  // FORM INPUT: Student manually selected range
  if (type === 'range') {
    // Accept as-is if valid enum, otherwise null
    return VALID_RANGES.includes(value) ? value : null;
  }

  // CV INPUT: Compare countries first
  if (type === 'city') {
    // Different countries = lowest score
    if (country && offerCountry &&
        String(country).toLowerCase() !== String(offerCountry).toLowerCase()) {
      return '200km_plus'; // Automatic lowest score
    }

    // TODO: Same country - implement distance calculation
    // For now, return null to indicate needs implementation
    // When we have distance calculation, return the mapped range

    // Placeholder: could be 'exact', '0_50km', '50_100km', etc.
    return null; // Will implement with distance calculation API
  }

  return null;
}

function normalizeApplicationData(rawData) {
  const { skills, diplomaLevel, location, type = 'form' } = rawData;

  // Normalize each field
  const normalizedSkills = normalizeSkills(skills);
  const normalizedDiploma = normalizeDiploma(diplomaLevel);
  const normalizedDistance = normalizeDistance(location);

  // Validation
  const errors = [];

  if (!normalizedSkills || normalizedSkills.length === 0) {
    errors.push('No valid skills provided');
  }

  if (normalizedDiploma === null) {
    errors.push('Invalid diploma level');
  }

  if (normalizedDistance === null && location.type === 'range') {
    errors.push('Invalid distance range');
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors: errors,
      data: null
    };
  }

  return {
    success: true,
    errors: [],
    data: {
      skills: normalizedSkills,
      diplomaLevel: normalizedDiploma,
      distanceRange: normalizedDistance,
      source: type // 'form' or 'cv'
    }
  };
}

module.exports = {
  normalizeSkills,
  normalizeDiploma,
  normalizeDistance,
  normalizeApplicationData,
  SKILL_MAP,
  DIPLOMA_MAP
};

