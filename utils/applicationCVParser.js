const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const { normalizeCityName } = require('./normalizers');

async function extractTextFromPDF(pdfPath) {
  try {
    let dataBuffer;
    if (typeof pdfPath === 'string') {
      dataBuffer = fs.readFileSync(pdfPath);
    } else if (Buffer.isBuffer(pdfPath)) {
      dataBuffer = pdfPath;
    } else {
      throw new Error('pdfPath must be a string (file path) or Buffer');
    }
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function getCoordinates(cityName) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        countrycodes: 'ma'
      },
      headers: {
        'User-Agent': 'InternshipApp/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      console.log(`[CV Parser] Geocoded "${cityName}" → ${display_name} (${lat}, ${lon})`);
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    }

    console.log(`[CV Parser] Could not geocode city: "${cityName}"`);
    return null;
  } catch (error) {
    console.log(`[CV Parser] Geocoding failed for "${cityName}": ${error.message}`);
    return null;
  }
}

function haversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToRange(km) {
  if (km <= 20) return 'exact';
  if (km <= 50) return '0_50km';
  if (km <= 100) return '50_100km';
  if (km <= 200) return '100_200km';
  return '200km_plus';
}

async function calculateDistanceRange(studentCity, offerLocation) {
  console.log(`[CV Parser] Calculating distance: "${studentCity}" → "${offerLocation}"`);

  if (!studentCity) {
    console.log('[CV Parser] No student city found in CV, defaulting to 50_100km');
    return '50_100km';
  }

  const normalizedStudentCity = normalizeCityName(studentCity);
  console.log(`[CV Parser] Normalized city: "${studentCity}" → "${normalizedStudentCity}"`);

  const [studentCoords, offerCoords] = await Promise.all([
    getCoordinates(normalizedStudentCity),
    getCoordinates(offerLocation)
  ]);

  if (!studentCoords || !offerCoords) {
    console.log('[CV Parser] Could not get coordinates for one or both cities, defaulting to 50_100km');
    return '50_100km';
  }

  const distanceKm = haversineDistance(studentCoords, offerCoords);
  const range = distanceToRange(Math.round(distanceKm));

  console.log(`[CV Parser] Distance: ${Math.round(distanceKm)} km → range: "${range}"`);
  return range;
}

async function parseCVForApplication(cvText, options = {}) {
  const {
    apiKey = process.env.OPENROUTER_API_KEY,
    model = 'meta-llama/llama-3.3-70b-instruct:free',
    temperature = 0,
    offerLocation = '',
    offerSkills = []
  } = options;

  if (!apiKey) throw new Error('OpenRouter API key is required.');

  const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',       // best overall, use first
  'google/gemma-4-31b-it:free',                    // proven working in your logs
  'nvidia/nemotron-3-super-120b-a12b:free',        // large model, but thinks out loud — keep as fallback
  'nousresearch/hermes-3-llama-3.1-405b:free',    // tuned for structured output
  'moonshotai/kimi-k2.6:free',                     // large context, good instruction following
  'nvidia/nemotron-nano-9b-v2:free',               // smaller but reliable, good last resort
];

  const skillsList = offerSkills.length > 0
    ? offerSkills.map(s => `- ${s}`).join('\n')
    : '(no specific skills required)';

  const systemPrompt = `You are a CV parser. Extract the following from the CV and return ONLY a valid JSON object, no markdown, no explanation.

Required skills to look for in the CV:
${skillsList}

Fields to extract:
1. "selected_skills": array of strings — only include skills from the list above that are clearly present in the CV. Include exact quotes or section names where you found each skill in "skills_evidence" for debugging.
2. "diploma_level": highest diploma, exactly one of: "high_school", "2nd_year", "bachelor", "master". Rules: bac/baccalauréat = high_school, 2 years post-bac = 2nd_year, 3 years post-bac (licence/bachelor) = bachelor, 5 years post-bac (master/ingénieur) = master. Include the exact text that made you choose this in "diploma_evidence".
3. "student_city": the main city where the student lives. If only a neighborhood or district is mentioned (like Lissasfa, Hay Riad, Ain Chock, Maarif, etc.), return the parent city instead (Casablanca, Rabat, etc.). Return only the city name, nothing else. If not found, return null.Include the exact text where you found it in "city_evidence".

Return exactly this structure:
{
  "selected_skills": [],
  "skills_evidence": "exact text from CV that contained the skills",
  "diploma_level": "bachelor",
  "diploma_evidence": "exact text from CV that determined diploma level",
  "student_city": "CityName",
  "city_evidence": "exact text from CV that contained the city"
}`;


  for (let attempt = 0; attempt < MODELS.length; attempt++) {
    const currentModel = MODELS[attempt];
    console.log(`[CV Parser] Attempt ${attempt + 1}/${MODELS.length} using model: ${currentModel}`);
 
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cvText }
          ],
          temperature,
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
            'X-Title': 'Internship App - CV Parser'
          }
        }
      );

      const raw = response.data.choices[0].message.content;
      console.log('[CV Parser] Raw LLM response:', raw);

      if (!raw || typeof raw !== 'string') {
        throw new Error('Model returned empty or null response');
      }

      const clean = raw.replace(/```json|```/g, '').trim();

      if (!clean.startsWith('{')) {
        throw new Error(`Model returned non-JSON response: ${clean.substring(0, 100)}`);
      }

      const parsedData = JSON.parse(clean);

      console.log('[CV Parser] --- EXTRACTION REPORT ---');
      console.log('[CV Parser] Skills found:', parsedData.selected_skills);
      console.log('[CV Parser] Skills evidence:', parsedData.skills_evidence);
      console.log('[CV Parser] Diploma:', parsedData.diploma_level);
      console.log('[CV Parser] Diploma evidence:', parsedData.diploma_evidence);
      console.log('[CV Parser] Student city:', parsedData.student_city);
      console.log('[CV Parser] City evidence:', parsedData.city_evidence);
      console.log('[CV Parser] --------------------------');

      const validDiplomas = ['high_school', '2nd_year', 'bachelor', 'master'];
      if (!validDiplomas.includes(parsedData.diploma_level)) {
        throw new Error(`Invalid diploma level returned: ${parsedData.diploma_level}`);
      }

      if (!Array.isArray(parsedData.selected_skills)) {
        throw new Error('selected_skills must be an array');
      }

      parsedData.selected_skills = parsedData.selected_skills
        .map(s => String(s).trim())
        .filter(s => s.length > 0);

      const distance_range = await calculateDistanceRange(parsedData.student_city, offerLocation);

      return {
        success: true,
        data: {
          selected_skills: parsedData.selected_skills,
          diploma_level: parsedData.diploma_level,
          distance_range
        },
        usage: {
          prompt_tokens: response.data.usage?.prompt_tokens,
          completion_tokens: response.data.usage?.completion_tokens,
          total_tokens: response.data.usage?.total_tokens
        }
      };

    } catch (error) {
      console.log(`[CV Parser] Attempt ${attempt + 1} failed (${currentModel}): ${error.message}`);
      if (attempt < MODELS.length - 1) {
        console.log(`[CV Parser] Falling back to next model...`);
        continue;
      }
      if (error.response) {
        throw new Error(`OpenRouter API error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
      }
      throw new Error(`CV parsing failed after all ${MODELS.length} attempts: ${error.message}`);
    }
  }
}

async function extractApplicationDataFromCV(pdfPath, options = {}) {
  try {
    console.log('[CV Parser] Extracting text from PDF...');
    const cvText = await extractTextFromPDF(pdfPath);
    console.log(`[CV Parser] Extracted ${cvText.length} characters from CV`);
    console.log('[CV Parser] Sending to OpenRouter for parsing...');

    const result = await parseCVForApplication(cvText, options);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const { selected_skills, diploma_level, distance_range } = result.data;

    console.log('[CV Parser] Final result → skills:', selected_skills, '| diploma:', diploma_level, '| distance:', distance_range);

    return {
      success: true,
      data: { selected_skills, diploma_level, distance_range },
      usage: result.usage
    };
  } catch (error) {
    console.error('[CV Parser] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  extractTextFromPDF,
  parseCVForApplication,
  extractApplicationDataFromCV
};