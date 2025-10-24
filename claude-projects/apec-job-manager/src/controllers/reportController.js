const { PrismaClient } = require('@prisma/client');
const reportService = require('../services/reportService');
const { AppError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

exports.getReports = async (req, res, next) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;

    const where = type ? { type } : {};

    const reports = await prisma.report.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { generatedAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateDailyReport = async (req, res, next) => {
  try {
    const report = await reportService.generateDailyReport();

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateWeeklyReport = async (req, res, next) => {
  try {
    const report = await reportService.generateWeeklyReport();

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateMonthlyReport = async (req, res, next) => {
  try {
    const report = await reportService.generateMonthlyReport();

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateCustomReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const report = await reportService.generateCustomReport(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    const exportedFile = await reportService.exportReport(report, format);

    res.download(exportedFile, `report-${id}.${format}`);
  } catch (error) {
    next(error);
  }
};
