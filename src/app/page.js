"use client"; // Marks this as a Client Component

import { useState } from 'react';
import { calculateHabitabilityScore, isWithinBounds } from '@/lib/scoring';
import testAddresses from '@/data/geocoding.json';

export default function HomePage() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = () => {
    setScoreData(null);
    setError(null);

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) ) {
      setError("The input is incorrect please try valid input.");
      return;
    }
    
    if (!isWithinBounds(lat, lon)) {
      setError("The entered coordinates are outside the supported area.");
      return;
    }

    const result = calculateHabitabilityScore(lat, lon);
    setScoreData(result);
  };
  
  const handleTestLocationClick = (lat, lon) => {
    setScoreData(null);
    setError(null);
    
    setLatitude(lat.toString());
    setLongitude(lon.toString());
    const result = calculateHabitabilityScore(lat, lon);
    setScoreData(result);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50 relative">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
          Habitability Scorer
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Enter coordinates to evaluate the habitability of a location.
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {/* Input section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              id="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 40.7128"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              id="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., -74.0060"
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Calculate Score
          </button>
        </div>

        {/* TEST LOCATIONS SECTION */}
        <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Or select a location</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {testAddresses.slice(0, 4).map((addr) => (
                    <button 
                        key={addr.address}
                        onClick={() => handleTestLocationClick(addr.latitude, addr.longitude)}
                        className="relative text-xs text-center py-2 px-2 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none group"
                        title={`Lat: ${addr.latitude}, Long: ${addr.longitude}`}
                    >
                        <span>{addr.address.split(',')[0]}</span>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      {/*  RESULTS DISPLAY SECTION */}
      {scoreData && (
        <div className="mt-12 w-full max-w-md bg-white p-8 rounded-xl shadow-lg animate-fade-in">
          <h2 className="text-2xl font-bold text-center text-gray-800">Habitability Score</h2>
          <div className="my-6 text-center">
            <span className="text-7xl font-bold text-blue-600">{scoreData.finalScore}</span>
            <span className="text-2xl text-gray-500">/ 100</span>
          </div>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-sm text-gray-500">Zone Score</p>
              <p className="text-2xl font-semibold text-gray-700">{scoreData.zoneScore}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Proximity Score</p>
              <p className="text-2xl font-semibold text-gray-700">{scoreData.proximityScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Score Guide Dropdown */}
      <div className="w-full max-w-md mt-4">
        <details className="bg-white rounded-xl shadow-lg">
          <summary className="cursor-pointer p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-gray-800">Score Guide</span>
            </div>
            <svg className="w-5 h-5 text-gray-500 transform transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="p-4 pt-2 text-sm border-t">
            {/* Zone Scores */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-800">Zone Score (40%)</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Air Quality</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Crime Rate</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>School Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Transit Access</span>
                </div>
              </div>
            </div>

            {/* Proximity Scores */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-800">Proximity Score (60%)</span>
              </div>
              <div className="grid grid-cols-2 gap-8 pl-4">
                <div>
                  <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Positive Factors
                  </p>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Parks & Recreation
                    </li>
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Schools & Libraries
                    </li>
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Healthcare & Stores
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                    Negative Factors
                  </p>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Industrial Areas
                    </li>
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Waste Facilities
                    </li>
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      High Crime Areas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}

