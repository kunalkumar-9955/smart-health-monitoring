const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { calculateRiskScore } = require('../services/aiEngine');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const Village = require('../models/Village');

// @GET /api/reports - Get all reports
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'field_worker') query.village = req.user.village;
    if (req.query.village) query.village = req.query.village;
    if (req.query.riskLevel) query.riskLevel = req.query.riskLevel;

    const reports = await Report.find(query).sort({ timestamp: -1 }).limit(100).populate('reportedBy', 'name email');
    res.json({ reports, total: reports.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/reports - Create report
router.post('/', protect, async (req, res) => {
  try {
    const { village, symptoms, casesCount, waterQuality, location, isMonsoon, source, severity } = req.body;
    
    // Validate village
    if (!village) {
        return res.status(400).json({ message: 'Village is required' });
    }

    // AI Prediction via service
    const risk = await calculateRiskScore({ casesCount, waterQuality, isMonsoon, village });
    
    const reportData = {
      reportedBy: req.user._id || req.user.id,
      reporterName: req.user.name,
      village,
      location: location || {},
      symptoms: symptoms || {},
      casesCount: casesCount || 1,
      severity: severity || 'mild',
      waterQuality: waterQuality || {},
      riskScore: risk.score,
      riskLevel: risk.level,
      isMonsoon: isMonsoon || false,
      source: source || 'web',
      status: 'pending',
      timestamp: new Date(),
    };

    const report = await Report.create(reportData);
    
    // Emit real-time event to clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_report', report);
    }
    
    // Create alert if HIGH risk
    if (risk.level === 'HIGH') {
      const alertData = {
        village, 
        title: `HIGH RISK Alert: ${village}`,
        message: `Risk score ${risk.score}. Immediate action required.`,
        riskLevel: risk.level, 
        riskScore: risk.score, 
        reportId: report._id, 
        isActive: true,
      };
      const alert = await Alert.create(alertData);
      
      // Update village stats
      await Village.findOneAndUpdate({ name: village }, { riskLevel: risk.level, riskScore: risk.score, waterStatus: waterQuality?.status || 'safe' }, { upsert: true });

      if (io) {
        io.emit('new_alert', alert);
      }
      
      // Trigger Email/SMS notification via service (TODO: implement nodemailer/twilio service call here)
      const notifyService = require('../services/notificationService');
      await notifyService.sendAlert(alertData);
    }

    return res.status(201).json({ report, riskAnalysis: risk });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/reports/stats - Stats for dashboard
router.get('/stats', protect, async (req, res) => {
  try {
    const totalCases = await Report.aggregate([{ $group: { _id: null, total: { $sum: '$casesCount' } } }]);
    const byRisk = await Report.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]);
    const byVillage = await Report.aggregate([
      { $group: { _id: '$village', cases: { $sum: '$casesCount' }, count: { $sum: 1 }, riskLevel: { $last: '$riskLevel' } } },
      { $sort: { cases: -1 } }
    ]);
    const trend = await Report.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, cases: { $sum: '$casesCount' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    res.json({ totalCases: totalCases[0]?.total || 0, byRisk, byVillage, trend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/reports/:id/status
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    
    const io = req.app.get('io');
    if (io && report) {
      io.emit('report_status_update', report);
    }
    
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
