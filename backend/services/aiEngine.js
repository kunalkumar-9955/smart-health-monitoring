/**
 * AI Outbreak Prediction Engine
 * Rule-based scoring system for disease outbreak risk assessment
 */

const axios = require('axios');
const Report = require('../models/Report');

const calculateRiskScore = async ({ casesCount = 1, waterQuality = {}, isMonsoon = false, village, location = null }) => {
  // 1. Fetch historical data (last 14 days)
  let historicalTrend = 0;
  if (village) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const pastReports = await Report.aggregate([
      { $match: { village, timestamp: { $gte: twoWeeksAgo } } },
      { $group: { _id: null, totalCases: { $sum: '$casesCount' } } }
    ]);
    if (pastReports.length > 0) {
      historicalTrend = pastReports[0].totalCases;
    }
  }

  // 2. Fetch real weather data from Open-Meteo if location is provided
  let isRainy = isMonsoon;
  let weatherFactor = isMonsoon ? 2 : 1;
  try {
    if (location && location.lat && location.lng) {
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current_weather=true`);
      if (response.data && response.data.current_weather) {
        const weatherCode = response.data.current_weather.weathercode;
        if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
          weatherFactor = 2.5; // active rain
          isRainy = true;
        } else if (isMonsoon) {
          weatherFactor = 2; // general monsoon season
          isRainy = true;
        } else {
          weatherFactor = 1;
          isRainy = false;
        }
      }
    }
  } catch (err) {
    console.log('Weather API failed, using fallback season factor', err.message);
  }

  // Water quality mapping for AI
  let wqAI = 0; // good
  if (waterQuality.status === 'contaminated' || waterQuality.bacterialPresence) wqAI = 2;
  else if (waterQuality.status === 'moderate') wqAI = 1;
  
  // Season mapping for AI: summer=0, monsoon=1, winter=2
  let seasonAI = isRainy ? 1 : 0;

  let riskScore = 0;
  let level = 'LOW';
  let confidence = null;

  // 3. Try to call the new Flask AI API
  try {
    const aiResponse = await axios.post('http://127.0.0.1:5001/predict', {
      cases: casesCount + historicalTrend, // considering historical cases too
      water_quality: wqAI,
      season: seasonAI
    }, { timeout: 3000 });

    if (aiResponse.data && aiResponse.data.risk) {
      level = aiResponse.data.risk.toUpperCase();
      confidence = aiResponse.data.confidence;
      // Map back to a synthetic score for the rest of the app to be happy
      riskScore = level === 'HIGH' ? 25 : level === 'MODERATE' ? 15 : 5;
    }
  } catch (error) {
    console.log('Flask AI API failed, falling back to rule-based engine', error.message);
    
    // Fallback logic
    let waterContamination = wqAI * 1.5;
    
    riskScore = Math.round((casesCount * 2) + (waterContamination * 3) + (weatherFactor * 2) + (historicalTrend * 0.5));
    if (riskScore >= 20) level = 'HIGH';
    else if (riskScore >= 10) level = 'MODERATE';
    else level = 'LOW';
  }

  const breakdown = {
    casesContribution: casesCount * 2,
    waterContribution: wqAI * 4.5,
    weatherContribution: weatherFactor * 2,
    historicalContribution: historicalTrend * 0.5,
    aiConfidence: confidence
  };

  const recommendations = generateRecommendations(level, waterQuality, casesCount, isRainy);

  return { score: riskScore, level, breakdown, recommendations, confidence };
};

const generateRecommendations = (level, waterQuality, cases, isMonsoon) => {
  const recs = [];

  if (level === 'HIGH') {
    recs.push('🚨 Immediate medical response required');
    recs.push('Deploy mobile health teams to affected area');
    recs.push('Issue public health advisory');
    recs.push('Establish isolation protocols');
  }
  if (level === 'MODERATE') {
    recs.push('⚠️ Increase surveillance frequency');
    recs.push('Distribute ORS packets and medication');
    recs.push('Conduct water quality testing');
  }
  if (waterQuality.bacterialPresence || waterQuality.status === 'contaminated') {
    recs.push('💧 Immediate water treatment required');
    recs.push('Distribute safe drinking water');
    recs.push('Install water purification units');
  }
  if (isMonsoon) {
    recs.push('🌧️ Monsoon protocol active — increase drainage inspection');
    recs.push('Prevent water stagnation in residential areas');
  }
  if (cases >= 10) {
    recs.push('Alert district health officer');
  }

  return recs;
};

// Parse SMS message
const parseSMSMessage = (message) => {
  const msg = message.toUpperCase();
  
  const diseases = ['DIARRHEA', 'CHOLERA', 'TYPHOID', 'FEVER', 'VOMITING', 'DYSENTERY'];
  const detected = diseases.filter(d => msg.includes(d));

  const caseMatch = msg.match(/(\d+)\s*CASES?/);
  const cases = caseMatch ? parseInt(caseMatch[1]) : 1;

  const villageMatch = msg.match(/VILLAGE[_\s](\w+)/);
  const village = villageMatch ? villageMatch[1].replace('_', ' ') : 'Unknown';

  const waterBad = msg.includes('WATER_BAD') || msg.includes('WATER BAD') || msg.includes('CONTAMINATED');
  const waterGood = msg.includes('WATER_GOOD') || msg.includes('WATER GOOD') || msg.includes('SAFE');

  return {
    diseases: detected,
    casesCount: cases,
    village,
    waterStatus: waterBad ? 'contaminated' : waterGood ? 'safe' : 'unknown',
    symptoms: {
      fever: detected.includes('FEVER'),
      diarrhea: detected.includes('DIARRHEA') || detected.includes('CHOLERA') || detected.includes('DYSENTERY'),
      vomiting: detected.includes('VOMITING'),
      dehydration: detected.includes('DIARRHEA') || detected.includes('CHOLERA'),
    },
    rawMessage: message,
  };
};

module.exports = { calculateRiskScore, parseSMSMessage, generateRecommendations };
