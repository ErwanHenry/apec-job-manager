const apecService = require('../services/apecService');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getAllJobs = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = status ? { status } : {};

    const jobs = await prisma.job.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.job.count({ where });

    res.json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobById = async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    res.json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

exports.createJob = async (req, res, next) => {
  try {
    const jobData = req.body;

    // Create job on APEC
    const job = await apecService.createJobPosting(jobData);

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_JOB',
        entity: 'Job',
        entityId: job.id,
        changes: jobData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(201).json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const updates = req.body;

    // Get APEC ID
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Update on APEC
    const updatedJob = await apecService.updateJobPosting(job.apecId, updates);

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_JOB',
        entity: 'Job',
        entityId: jobId,
        changes: updates,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      status: 'success',
      data: { job: updatedJob }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Delete on APEC
    await apecService.deleteJobPosting(job.apecId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_JOB',
        entity: 'Job',
        entityId: jobId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      status: 'success',
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.syncJobs = async (req, res, next) => {
  try {
    logger.info('Manual synchronization requested');

    const syncReport = await apecService.syncJobs();

    // Save sync history
    await prisma.syncHistory.create({
      data: {
        syncType: 'MANUAL',
        status: 'SUCCESS',
        jobsCreated: syncReport.created,
        jobsUpdated: syncReport.updated,
        jobsDeleted: syncReport.deleted,
        jobsUnchanged: syncReport.unchanged,
        errors: syncReport.errors,
        completedAt: new Date()
      }
    });

    res.json({
      status: 'success',
      data: { syncReport }
    });
  } catch (error) {
    next(error);
  }
};
