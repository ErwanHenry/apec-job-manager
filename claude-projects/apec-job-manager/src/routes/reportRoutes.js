const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getReports);
router.get('/daily', reportController.generateDailyReport);
router.get('/weekly', reportController.generateWeeklyReport);
router.get('/monthly', reportController.generateMonthlyReport);
router.get('/custom', reportController.generateCustomReport);
router.get('/:id/export', reportController.exportReport);

module.exports = router;
