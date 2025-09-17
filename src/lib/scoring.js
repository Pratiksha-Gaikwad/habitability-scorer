import amenitiesData from '@/data/features.json';
import polygonData from '@/data/features_poly.json';
import { point, polygon, booleanPointInPolygon, distance } from '@turf/turf';

// --- CONFIGURATION CONSTANTS ---

// 1. Define the influence radius for amenities (in kilometers)
const INFLUENCE_RADIUS = 1.5;

// 2. Define weights for combining the final scores
const SCORE_WEIGHTS = {
  zone: 0.4,       // 40% of the final score
  proximity: 0.6,  // 60% of the final score
};

// 3. Define min/max ranges for normalizing polygon data.
// These are derived by looking at the min/max values in features_poly.json
const RANGES = {
  air_quality_index: { min: 11, max: 22, invert: true }, // Lower is better
  crime_rate: { min: 2.8, max: 6.7, invert: true },       // Lower is better
  median_rent: { min: 3400, max: 5800, invert: true },    // Lower is better
  school_quality: { min: 6.4, max: 9.1, invert: false },  // Higher is better
  transit_distance: { min: 0.05, max: 0.45, invert: true },// Lower is better (distance to transit)
};

// 4. Define weights for different amenity types
const AMENITY_WEIGHTS = {
  'park': { type: 'positive', maxScore: 10 },
  'grocery': { type: 'positive', maxScore: 10 },
  'school': { type: 'positive', maxScore: 10 },
  'hospital': { type: 'positive', maxScore: 10 },
  'museum': { type: 'positive', maxScore: 7 },
  'library': { type: 'positive', maxScore: 7 },
  'pharmacy': { type: 'positive', maxScore: 5 },
  'gym': { type: 'positive', maxScore: 5 },
  'community_center': { type: 'positive', maxScore: 5 },
  'cafe': { type: 'positive', maxScore: 5 },
  'shopping': { type: 'positive', maxScore: 5 },
  'police_station': { type: 'positive', maxScore: 3 },
  'fire_station': { type: 'positive', maxScore: 3 },
  'waste_facility': { type: 'negative', maxScore: 15 },
  'jail': { type: 'negative', maxScore: 15 },
  'prison': { type: 'negative', maxScore: 15 },
  'hazardous_waste': { type: 'negative', maxScore: 15 },
  'crime_hotspot': { type: 'negative', maxScore: 15 },
  'sanitation_facility': { type: 'negative', maxScore: 8 },
  'industrial_complex': { type: 'negative', maxScore: 8 },
  'power_plant': { type: 'negative', maxScore: 8 },
  'homeless_shelter': { type: 'negative', maxScore: 5 },
  'methadone_clinic': { type: 'negative', maxScore: 5 },
  'adult_entertainment': { type: 'negative', maxScore: 5 },
};


// --- HELPER FUNCTIONS ---

/**
 * Normalizes a raw value to a 0-100 scale based on predefined ranges.
 */
function normalize(value, aspect) {
  const range = RANGES[aspect];
  if (!range || value === undefined) return 50; // Return a neutral score if range isn't defined

  // Calculate the score as a percentage of the range
  let normalized = ((value - range.min) / (range.max - range.min)) * 100;
  
  // Clamp the value between 0 and 100 in case the input is outside the expected range
  normalized = Math.max(0, Math.min(100, normalized));

  return range.invert ? 100 - normalized : normalized;
}


// --- SCORING FUNCTIONS ---

/**
 * Calculates the Zone Score based on polygon data.
 */
function calculateZoneScore(inputPoint) {
  const rawValues = {};
  
  // Group polygons by their "aspect" (e.g., crime_rate, median_rent)
  const polygonsByAspect = polygonData.reduce((acc, p) => {
    const aspect = p.aspect;
    if (!acc[aspect]) acc[aspect] = [];
    acc[aspect].push(p);
    return acc;
  }, {});

  // For each aspect, find the polygon that contains the input point
  for (const aspect in polygonsByAspect) {
    for (const poly of polygonsByAspect[aspect]) {
      // Create a Turf.js polygon object for the check
      const turfPolygon = polygon([poly.coordinates]);
      if (booleanPointInPolygon(inputPoint, turfPolygon)) {
        // The aspect key might be 'crime_rate', 'median_rent', etc.
        const valueKey = Object.keys(poly).find(k => RANGES[k]);
        if (valueKey) {
          rawValues[aspect] = poly[valueKey];
        }
        break; // Found the correct polygon for this aspect, move to the next
      }
    }
  }

  // Normalize each raw value
  const normalizedScores = Object.entries(rawValues).map(([aspect, value]) => normalize(value, aspect));
  
  // Calculate the average of all normalized scores for the final zone score
  if (normalizedScores.length === 0) return 50; // Return neutral score if no data found
  const totalScore = normalizedScores.reduce((sum, score) => sum + score, 0);
  return totalScore / normalizedScores.length;
}

/**
 * Calculates the Proximity Score based on distance to amenities.
 */
function calculateProximityScore(inputPoint) {
  let totalProximityScore = 0;

  for (const feature of amenitiesData) {
    const amenityPoint = point([feature.longitude, feature.latitude]);
    const dist = distance(inputPoint, amenityPoint, { units: 'kilometers' });

    if (dist <= INFLUENCE_RADIUS) {
      const weight = AMENITY_WEIGHTS[feature.type];
      if (!weight) continue; // Ignore amenity types not in our config

      // Calculate score using linear decay (closer = higher score)
      const score = weight.maxScore * (1 - (dist / INFLUENCE_RADIUS));
      
      if (weight.type === 'positive') {
        totalProximityScore += score;
      } else {
        totalProximityScore -= score;
      }
    }
  }

  // Normalize the score to a 0-100 scale. We need to estimate a reasonable min/max.
  // Let's assume a reasonable range is -50 to +100 for this normalization.
  const minScore = -50;
  const maxScore = 100;
  let normalizedScore = ((totalProximityScore - minScore) / (maxScore - minScore)) * 100;
  
  // Clamp the final score between 0 and 100
  return Math.max(0, Math.min(100, normalizedScore));
}


// --- MAIN EXPORTED FUNCTION ---

// /**
//  * Calculates the final, combined Habitability Score.
//  * This is the only function you'll need to import into your UI components.
//  */
// export function calculateHabitabilityScore(latitude, longitude) {
//   // Turf.js expects coordinates in [longitude, latitude] format
//   const inputPoint = point([longitude, latitude]);

//   // Calculate the two sub-scores
//   const zoneScore = calculateZoneScore(inputPoint);
//   const proximityScore = calculateProximityScore(inputPoint);

//   // Combine them using the defined weights
//   const finalScore = (zoneScore * SCORE_WEIGHTS.zone) + (proximityScore * SCORE_WEIGHTS.proximity);

//   // Return a detailed score object
//   return {
//     finalScore: Math.round(finalScore),
//     zoneScore: Math.round(zoneScore),
//     proximityScore: Math.round(proximityScore),
//   };
// }

// --- MAIN EXPORTED FUNCTION ---

function calculateHabitabilityScore(latitude, longitude) {
  // ... all the same function code inside ...
  const inputPoint = point([longitude, latitude]);
  const zoneScore = calculateZoneScore(inputPoint);
  const proximityScore = calculateProximityScore(inputPoint);
  const finalScore = (zoneScore * SCORE_WEIGHTS.zone) + (proximityScore * SCORE_WEIGHTS.proximity);
  return {
    finalScore: Math.round(finalScore),
    zoneScore: Math.round(zoneScore),
    proximityScore: Math.round(proximityScore),
  };
}

// Export the function at the end of the file
export { calculateHabitabilityScore };