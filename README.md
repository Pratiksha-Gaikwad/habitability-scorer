# Manhattan Habitability Scorer

A Next.js application that calculates habitability scores for locations in Manhattan based on various environmental, social, and infrastructure factors.

## Overview

This application evaluates locations in Manhattan using a comprehensive scoring system that considers both zone-based metrics (40%) and proximity to various amenities (60%). The score helps users assess the overall livability of different areas.

## Technical Implementation

### Scoring Formula and Rationale

The final habitability score is calculated using a weighted combination of two main components:

1. **Zone Score (40% of total)**
   ```
   Zone Score = Normalized sum of:
   - Air Quality Index (11-22, lower better)
   - Crime Rate (2.8-6.7, lower better)
   - Median Rent ($3400-$5800, lower better)
   - School Quality (6.4-9.1, higher better)
   - Transit Distance (1 mile, lower better)
   ```

   Each metric is normalized to a 0-100 scale using predefined ranges. For metrics where lower values are better (like crime rate), the normalized score is inverted (100 - normalized value).

2. **Proximity Score (60% of total)**
   ```
   Proximity Score = Sum of positive amenity scores - Sum of negative amenity scores
   Where:
   - Individual amenity score = (maxScore * (1 - distance/INFLUENCE_RADIUS))
   - INFLUENCE_RADIUS = 1 mile
   ```

   Positive amenities (parks, schools, etc.) contribute positively, while negative factors (waste facilities, industrial areas) reduce the score.

### Geographic Calculations

#### Polygon Membership
- Uses Turf.js `booleanPointInPolygon` for efficient point-in-polygon testing
- Each location is checked against all zone polygons to determine which metrics apply
- Overlapping polygons are handled by taking the most recent/relevant data

#### Distance Calculations
- Implemented using Turf.js distance functions
- Uses haversine formula for accurate geodesic distance calculation
- Distances are calculated in kilometers and converted as needed
- Considers Earth's curvature for accurate measurements

### Trade-offs and Considerations

1. **Performance vs. Accuracy**
   - Pre-processed polygon data to optimize point-in-polygon checks
   - Limited influence radius to 1 mile to reduce unnecessary calculations
   - Balanced between calculation accuracy and response time

2. **Data Normalization**
   - Used fixed ranges for normalization based on Manhattan data
   - Ranges might need adjustment for other areas
   - Chose linear normalization for simplicity and interpretability

3. **Geographic Boundaries**
   - Strict boundary checking to ensure calculations only within Manhattan
   - Edge cases near water bodies handled by polygon boundaries
   - Some areas near borough borders might have incomplete data

4. **Scoring Weights**
   ```javascript
   const SCORE_WEIGHTS = {
       zone: 0.4,      // 40% from zone-based metrics
       proximity: 0.6   // 60% from proximity to amenities
   };
   ```
   - Weighted towards proximity factors as they have more direct impact
   - Zone metrics weighted less due to averaging across larger areas

5. **Assumptions**
   - All amenities of the same type have equal importance
   - Linear distance decay for amenity influence
   - No seasonal variations in metrics
   - Data currency assumed within last 12 months

### Implementation Notes

1. **Data Structure**
   ```javascript
   // Example amenity weight structure
   const AMENITY_WEIGHTS = {
     'park': { type: 'positive', maxScore: 10 },
     'school': { type: 'positive', maxScore: 10 },
     'waste_facility': { type: 'negative', maxScore: 15 }
   };
   ```

2. **Validation**
   - Coordinate bounds checking
   - Data presence validation
   - Score range normalization (0-100)

3. **Error Handling**
   - Graceful fallback for missing data
   - Default neutral scores for unknown metrics
   - User feedback for invalid coordinates

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- Next.js 15.5.3
- React 19.1.0
- Turf.js for geospatial calculations
- Tailwind CSS for styling

## Data Sources

- `features.json`: Point-based amenities
- `features_poly.json`: Zone-based metrics
- `geocoding.json`: Test locations

