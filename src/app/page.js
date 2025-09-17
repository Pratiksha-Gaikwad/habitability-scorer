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
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Or select a test location</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {testAddresses.slice(0, 4).map((addr) => (
                    <button 
                        key={addr.address}
                        onClick={() => handleTestLocationClick(addr.latitude, addr.longitude)}
                        className="text-xs text-center py-2 px-2 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none"
                    >
                        {addr.address.split(',')[0]}
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
    </main>
  );
}

