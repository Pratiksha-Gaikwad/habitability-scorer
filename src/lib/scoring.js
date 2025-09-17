import amenitiesData from '@/data/features.json';      // Point-based amenities (parks, schools, etc.)
import polygonData from '@/data/features_poly.json';   // Zone data (crime rates, air quality, etc.)
import { point, polygon, booleanPointInPolygon, distance } from '@turf/turf';

// Maximum distance (in miles) to consider amenities' influence on a location
const INFLUENCE_RADIUS = 1; 

// Weight distribution for final score calculation
const SCORE_WEIGHTS = { 
    zone: 0.4,      // 40% from zone-based metrics
    proximity: 0.6   // 60% from proximity to amenities
};

// Value ranges for normalizing zone-based metrics; Each metric includes min/max values and whether lower values are better (invert: true)
const RANGES = {
    air_quality_index: { min: 11, max: 22, invert: true },    // Lower is better
    crime_rate: { min: 2.8, max: 6.7, invert: true },         // Lower is better
    median_rent: { min: 3400, max: 5800, invert: true },      // Lower is better
    school_quality: { min: 6.4, max: 9.1, invert: false },    // Higher is better
    transit_distance: { min: 0.05, max: 0.45, invert: true }, // Shorter transit is better
};
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

/**
 * Calculates the geographical boundaries of our dataset
 * Considers both amenity locations and polygon zones and returns Minimum and maximum latitude/longitude values
 */
function getBounds() {
    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    
    // Check amenity locations
    amenitiesData.forEach(feature => {
        minLat = Math.min(minLat, feature.latitude);
        maxLat = Math.max(maxLat, feature.latitude);
        minLon = Math.min(minLon, feature.longitude);
        maxLon = Math.max(maxLon, feature.longitude);
    });
    
    // Check polygon boundaries
    polygonData.forEach(poly => {
        poly.coordinates.forEach(coord => {
            minLon = Math.min(minLon, coord[0]);
            maxLon = Math.max(maxLon, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
        });
    });
    
    return { minLat, maxLat, minLon, maxLon };
}
const dataBounds = getBounds();


function isWithinBounds(latitude, longitude) {
    return (
        latitude >= dataBounds.minLat &&
        latitude <= dataBounds.maxLat &&
        longitude >= dataBounds.minLon &&
        longitude <= dataBounds.maxLon
    );
}


// Converts raw values to a 0-100 scale based on predefined ranges

function normalize(value, aspect) {
    const range = RANGES[aspect];
    if (!range || value === undefined) return 50; // Default to neutral score if no data
    
    // Convert to 0-100 scale
    let normalized = ((value - range.min) / (range.max - range.min)) * 100;
    normalized = Math.max(0, Math.min(100, normalized));
    
    // Invert if needed
    return range.invert ? 100 - normalized : normalized;
}


//  Calculates score based on zone characteristics (crime, air quality, etc.) and return the score

function calculateZoneScore(inputPoint) {
  const rawValues = {};
  const polygonsByAspect = polygonData.reduce((acc, p) => {
    const aspect = p.aspect;
    if (!acc[aspect]) acc[aspect] = [];
    acc[aspect].push(p);
    return acc;
  }, {});
  for (const aspect in polygonsByAspect) {
    for (const poly of polygonsByAspect[aspect]) {
      const turfPolygon = polygon([poly.coordinates]);
      if (booleanPointInPolygon(inputPoint, turfPolygon)) {
        const valueKey = Object.keys(poly).find(k => RANGES[k]);
        if (valueKey) {
          rawValues[aspect] = poly[valueKey];
        }
        break;
      }
    }
  }
  const normalizedScores = Object.entries(rawValues).map(([aspect, value]) => normalize(value, aspect));
  if (normalizedScores.length === 0) return 50;
  const totalScore = normalizedScores.reduce((sum, score) => sum + score, 0);
  return totalScore / normalizedScores.length;
}

// Calculates score based on nearby amenities within INFLUENCE_RADIUS
// Considers both positive (parks, schools) and negative (waste facilities) factors.

function calculateProximityScore(inputPoint) {
    let totalProximityScore = 0;
    
    // Calculate impact of each nearby amenity
    for (const feature of amenitiesData) {
        const amenityPoint = point([feature.longitude, feature.latitude]);
        const dist = distance(inputPoint, amenityPoint, { units: 'miles' });
        
        // Only consider amenities within influence radius
        if (dist <= INFLUENCE_RADIUS) {
            const weight = AMENITY_WEIGHTS[feature.type];
            if (!weight) continue; // Skip if amenity type not configured
            
            // Score decreases linearly with distance
            const score = weight.maxScore * (1 - (dist / INFLUENCE_RADIUS));
            
            // Add or subtract based on amenity type
            if (weight.type === 'positive') {
                totalProximityScore += score;
            } else {
                totalProximityScore -= score;
            }
        }
    }
  const minScore = -50;
  const maxScore = 100;
  let normalizedScore = ((totalProximityScore - minScore) / (maxScore - minScore)) * 100;
  return Math.max(0, Math.min(100, normalizedScore));
}



//  Function to calculate habitability score and combines zone-based metrics and proximity to amenities

function calculateHabitabilityScore(latitude, longitude) {
    // Convert coordinates in longitude, latitude order)
    const input = point([longitude, latitude]);
    
    // Calculate component scores
    const zoneScore = calculateZoneScore(input);
    const proximityScore = calculateProximityScore(input);
    
    // Calculate weighted final score
    const finalScore = (zoneScore * SCORE_WEIGHTS.zone) + 
                      (proximityScore * SCORE_WEIGHTS.proximity);
    
    // Return rounded scores
    return {
        finalScore: Math.round(finalScore),
        zoneScore: Math.round(zoneScore),
        proximityScore: Math.round(proximityScore),
    };
}


export { calculateHabitabilityScore, isWithinBounds };

